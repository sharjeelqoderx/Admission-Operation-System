"use client"



import { memo } from "react"

import { Typography } from "@/components/shared/Typography"

import { BluryCard } from "@/components/shared/blury-card"

import { OverviewStatCards } from "./overview-stat-cards"

import { OverviewRecentTables } from "./overview-recent-tables"

import { withUniversityOverviewLogic } from "./withUniversityOverviewLogic"

import type { UniversityOverview } from "@/types/schemas/university-overview"



type UniversityOverviewViewProps = {

    overview: UniversityOverview

}



const UniversityOverviewView = memo(function UniversityOverviewView({

    overview,

}: UniversityOverviewViewProps) {

    return (

        <div className="space-y-6 animate-in fade-in duration-700">

            <BluryCard

                isCentered={false}

                blurAmount="backdrop-blur-lg"

                blendColorClass="bg-white/10"

                className="rounded-xl"

                childClass="space-y-2 p-5 md:p-6"

            >

                <Typography as="h2" font="sub-heading" className="font-bold tracking-tight text-brand-primary">

                    {overview.title}

                </Typography>

                <Typography as="p" font="sub-text" className="max-w-3xl leading-relaxed text-gray-500">

                    {overview.subtitle}

                </Typography>

            </BluryCard>



            <OverviewStatCards stats={overview.stats} />



            <OverviewRecentTables recent={overview.recent} />

        </div>

    )

})



const UniversityOverviewContent = withUniversityOverviewLogic(UniversityOverviewView)



type PageContentProps = {

    initialOverview: UniversityOverview

}



export function UniversityOverviewPageContent({ initialOverview }: PageContentProps) {

    return <UniversityOverviewContent initialOverview={initialOverview} />

}


