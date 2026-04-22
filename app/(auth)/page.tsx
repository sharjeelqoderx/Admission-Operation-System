import React from 'react'
import { Typography } from '@/components/shared/Typography'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GraduationCap, HatGlasses } from 'lucide-react'
import Link from 'next/link'

const page = () => {
    return (
        <div className='min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500 flex-center p-8 sm:p-16'>
            <div className='w-full max-w-[515px] mx-auto space-y-8'>
                <div>
                    <Typography as={'h1'} font='sub-heading'>
                        Create your account
                    </Typography>
                    <Typography as={'p'} font='text'>
                        Who are you? Select your account type to get started.
                    </Typography>
                </div>
                <div className='space-y-4'>
                    <Link href="/signup?role=student" className='block'>
                        <Card className='radius-md px-6 py-4 min-h-[100px] bg-brand-byzantine flex items-center flex-row gap-3'>
                            <Button size={'icon-xl'} className='bg-white/10 backdrop-blur-md'>
                                <GraduationCap size={34} />
                            </Button>
                            <div className='text-white'>
                                <Typography as={'h1'} font='title'>
                                    Student
                                </Typography>
                                <Typography as={'p'} font='sub-text'>
                                    Apply to programs, track your application, and manage documents
                                </Typography>
                            </div>
                        </Card>
                    </Link>
                    <Link href="/signup?role=agent" className='block'>
                        <Card className='radius-md px-6 py-4 min-h-[100px] bg-brand-secondary flex items-center flex-row gap-3'>
                            <Button size={'icon-xl'} className='bg-white/10 backdrop-blur-md'>
                                <HatGlasses size={34} />
                            </Button>
                            <div className='text-white'>
                                <Typography as={'h1'} font='title'>
                                    Agent
                                </Typography>
                                <Typography as={'p'} font='sub-text'>
                                    Manage student applications, track commissions, and grow your partnership                            </Typography>
                            </div>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default page