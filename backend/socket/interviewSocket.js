import { Interview } from "../models/interview.model.js";
import { mockStore } from "../utils/mockStore.js";
import mongoose from "mongoose";

const isDbConnected = () => mongoose.connection.readyState === 1;

// Active rooms map: roomId -> Map(socketId -> participantData)
const roomParticipants = new Map();

export const setupInterviewSocket = (io) => {
    io.on("connection", (socket) => {
        console.log(`[InterviewSocket] Client connected: ${socket.id}`);

        // 1. Join Interview Room
        socket.on("join-interview-room", async ({ roomId, userId, userName, userRole, isVideoOn = true, isMicOn = true }) => {
            if (!roomId) return;

            socket.join(roomId);
            socket.data.roomId = roomId;
            socket.data.userId = userId;
            socket.data.userName = userName || "Participant";
            socket.data.userRole = userRole || "guest";
            socket.data.isVideoOn = isVideoOn;
            socket.data.isMicOn = isMicOn;

            if (!roomParticipants.has(roomId)) {
                roomParticipants.set(roomId, new Map());
            }

            const currentRoom = roomParticipants.get(roomId);
            
            // Get existing peers in the room before adding self
            const existingPeers = [];
            currentRoom.forEach((participant, peerSocketId) => {
                if (peerSocketId !== socket.id) {
                    existingPeers.push({
                        socketId: peerSocketId,
                        userId: participant.userId,
                        userName: participant.userName,
                        userRole: participant.userRole,
                        isVideoOn: participant.isVideoOn,
                        isMicOn: participant.isMicOn,
                        isScreenSharing: participant.isScreenSharing || false,
                    });
                }
            });

            // Register current socket
            currentRoom.set(socket.id, {
                socketId: socket.id,
                userId,
                userName: socket.data.userName,
                userRole: socket.data.userRole,
                isVideoOn,
                isMicOn,
                isScreenSharing: false,
                joinedAt: new Date(),
            });

            console.log(`[InterviewSocket] ${socket.data.userName} (${socket.data.userRole}) joined room ${roomId}. Total peers: ${currentRoom.size}`);

            // Send existing participants to the newly joined peer
            socket.emit("existing-participants", {
                peers: existingPeers,
                selfSocketId: socket.id,
            });

            // Notify everyone else in the room that a new peer joined
            socket.to(roomId).emit("participant-joined", {
                socketId: socket.id,
                userId,
                userName: socket.data.userName,
                userRole: socket.data.userRole,
                isVideoOn,
                isMicOn,
            });
        });

        // 2. WebRTC Signaling: Offer
        socket.on("webrtc-offer", ({ targetSocketId, sdp }) => {
            if (!targetSocketId || !sdp) return;
            io.to(targetSocketId).emit("webrtc-offer", {
                fromSocketId: socket.id,
                sdp,
                senderInfo: {
                    userId: socket.data.userId,
                    userName: socket.data.userName,
                    userRole: socket.data.userRole,
                },
            });
        });

        // 3. WebRTC Signaling: Answer
        socket.on("webrtc-answer", ({ targetSocketId, sdp }) => {
            if (!targetSocketId || !sdp) return;
            io.to(targetSocketId).emit("webrtc-answer", {
                fromSocketId: socket.id,
                sdp,
            });
        });

        // 4. WebRTC Signaling: ICE Candidate
        socket.on("webrtc-ice-candidate", ({ targetSocketId, candidate }) => {
            if (!targetSocketId || !candidate) return;
            io.to(targetSocketId).emit("webrtc-ice-candidate", {
                fromSocketId: socket.id,
                candidate,
            });
        });

        // 5. Media State Updates (Camera On/Off, Mic Mute/Unmute, Screenshare)
        socket.on("media-state-change", ({ roomId, isVideoOn, isMicOn, isScreenSharing }) => {
            const currentRoomId = roomId || socket.data.roomId;
            if (!currentRoomId) return;

            const room = roomParticipants.get(currentRoomId);
            if (room && room.has(socket.id)) {
                const participant = room.get(socket.id);
                if (isVideoOn !== undefined) participant.isVideoOn = isVideoOn;
                if (isMicOn !== undefined) participant.isMicOn = isMicOn;
                if (isScreenSharing !== undefined) participant.isScreenSharing = isScreenSharing;
            }

            socket.to(currentRoomId).emit("participant-media-state", {
                socketId: socket.id,
                isVideoOn,
                isMicOn,
                isScreenSharing,
            });
        });

        // 6. Real-time Live Code Collaboration
        socket.on("code-change", async ({ roomId, code, language }) => {
            const currentRoomId = roomId || socket.data.roomId;
            if (!currentRoomId) return;

            // Broadcast to other participants in room
            socket.to(currentRoomId).emit("code-update", {
                code,
                language,
                senderId: socket.data.userId,
                senderName: socket.data.userName,
            });

            // Asynchronously persist to DB/mock store
            try {
                if (isDbConnected()) {
                    await Interview.updateOne(
                        { roomId: currentRoomId },
                        { $set: { sharedCode: code, ...(language ? { sharedLanguage: language } : {}) } }
                    );
                } else {
                    const interview = (mockStore.interviews || []).find((i) => i.roomId === currentRoomId);
                    if (interview) {
                        interview.sharedCode = code;
                        if (language) interview.sharedLanguage = language;
                    }
                }
            } catch (err) {
                console.warn("[InterviewSocket] Code persist error:", err.message);
            }
        });

        // 7. Real-time Language Switch
        socket.on("language-change", async ({ roomId, language }) => {
            const currentRoomId = roomId || socket.data.roomId;
            if (!currentRoomId) return;

            socket.to(currentRoomId).emit("language-update", {
                language,
                senderName: socket.data.userName,
            });

            try {
                if (isDbConnected()) {
                    await Interview.updateOne({ roomId: currentRoomId }, { $set: { sharedLanguage: language } });
                } else {
                    const interview = (mockStore.interviews || []).find((i) => i.roomId === currentRoomId);
                    if (interview) interview.sharedLanguage = language;
                }
            } catch (err) {
                console.warn("[InterviewSocket] Language persist error:", err.message);
            }
        });

        // 8. Code Execution Run Broadcast
        socket.on("code-run", ({ roomId, output, language }) => {
            const currentRoomId = roomId || socket.data.roomId;
            if (!currentRoomId) return;

            socket.to(currentRoomId).emit("code-run-result", {
                output,
                language,
                runnerName: socket.data.userName,
            });
        });

        // 9. Real-time In-Room Chat
        socket.on("chat-message", async ({ roomId, message }) => {
            const currentRoomId = roomId || socket.data.roomId;
            if (!currentRoomId || !message || !message.text) return;

            const chatPayload = {
                senderId: socket.data.userId || message.senderId || "user",
                senderName: socket.data.userName || message.senderName || "Participant",
                senderRole: socket.data.userRole || message.senderRole || "candidate",
                text: message.text.trim(),
                timestamp: message.timestamp || new Date().toISOString(),
            };

            // Broadcast to all participants in room including sender (or sender can append optimistically)
            io.in(currentRoomId).emit("chat-message", chatPayload);

            // Persist to MongoDB / mock store
            try {
                if (isDbConnected()) {
                    await Interview.updateOne(
                        { roomId: currentRoomId },
                        {
                            $push: {
                                chatMessages: {
                                    senderId: chatPayload.senderId,
                                    senderName: chatPayload.senderName,
                                    senderRole: chatPayload.senderRole,
                                    text: chatPayload.text,
                                    timestamp: new Date(chatPayload.timestamp),
                                },
                            },
                        }
                    );
                } else {
                    const interview = (mockStore.interviews || []).find((i) => i.roomId === currentRoomId);
                    if (interview) {
                        if (!interview.chatMessages) interview.chatMessages = [];
                        interview.chatMessages.push(chatPayload);
                    }
                }
            } catch (err) {
                console.warn("[InterviewSocket] Chat message persist error:", err.message);
            }
        });

        // 10. Disconnect Handler
        socket.on("disconnect", () => {
            const roomId = socket.data.roomId;
            if (roomId && roomParticipants.has(roomId)) {
                const room = roomParticipants.get(roomId);
                room.delete(socket.id);
                console.log(`[InterviewSocket] ${socket.data.userName} left room ${roomId}. Remaining: ${room.size}`);

                socket.to(roomId).emit("participant-left", {
                    socketId: socket.id,
                    userId: socket.data.userId,
                    userName: socket.data.userName,
                    userRole: socket.data.userRole,
                });

                if (room.size === 0) {
                    roomParticipants.delete(roomId);
                }
            }
        });
    });
};
