import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { Loader2, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AI_API_END_POINT } from '@/utils/constant'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

const RecommendedJobs = ({ embedded = false }) => {
    const [recommendations, setRecommendations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const loadRecommendations = useCallback(async (showToast = false) => {
        try {
            setLoading(true)
            setError('')
            const res = await axios.get(`${AI_API_END_POINT}/recommendations`, { withCredentials: true })
            setRecommendations(res.data.recommendations || [])
            if (showToast) toast.success('Recommendations refreshed.')
        } catch (requestError) {
            const message = requestError.response?.data?.message || 'Unable to load AI recommendations right now.'
            setError(message)
            if (showToast) toast.error(message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadRecommendations() }, [loadRecommendations])

    return (
        <section className={`${embedded ? 'mt-12' : 'max-w-4xl mx-auto my-5'} bg-white border border-gray-200 rounded-2xl p-6`}>
            <div className='flex items-center justify-between gap-4 mb-4'>
                <div>
                    <h1 className='font-bold text-lg'>Recommended Jobs</h1>
                    <p className='text-sm text-gray-500'>Matched from currently available jobs using your profile and resume.</p>
                </div>
                <Button variant='outline' onClick={() => loadRecommendations(true)} disabled={loading}>
                    {loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <RefreshCw className='mr-2 h-4 w-4' />}
                    Refresh
                </Button>
            </div>
            {loading && <div className='py-8 text-center text-gray-500'><Loader2 className='inline mr-2 h-4 w-4 animate-spin' />Finding relevant jobs...</div>}
            {!loading && error && <div className='rounded-md bg-red-50 p-4 text-sm text-red-700'>{error}</div>}
            {!loading && !error && recommendations.length === 0 && <p className='py-5 text-sm text-gray-500'>No recommendations are available yet. Add skills or a resume, then refresh.</p>}
            {!loading && !error && recommendations.length > 0 && <div className='space-y-4'>
                {recommendations.map((item) => (
                    <div key={item.jobId} className='rounded-lg border border-gray-100 p-4 shadow-sm'>
                        <div className='flex flex-wrap items-start justify-between gap-3'>
                            <div>
                                <h2 className='font-semibold'>{item.job?.title}</h2>
                                <p className='text-sm text-gray-500'>{item.job?.company?.name} · {item.job?.location}</p>
                            </div>
                            <Badge className='bg-[#7209b7]'>{item.matchScore}% match</Badge>
                        </div>
                        <p className='mt-3 text-sm text-gray-600'>{item.reason}</p>
                        <div className='mt-3 space-y-2 text-sm'>
                            <div><span className='font-medium'>Matching skills: </span>{item.matchingSkills?.length ? item.matchingSkills.join(', ') : 'Profile match'}</div>
                            <div><span className='font-medium'>Skills to build: </span>{item.missingSkills?.length ? item.missingSkills.join(', ') : 'None identified'}</div>
                        </div>
                        <Button className='mt-4' variant='outline' onClick={() => navigate(`/description/${item.jobId}`)}>View job</Button>
                    </div>
                ))}
            </div>}
        </section>
    )
}

export default RecommendedJobs
