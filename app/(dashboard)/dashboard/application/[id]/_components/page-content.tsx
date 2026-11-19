"use client"

import { withApplicationDetailLogic } from "./withApplicationDetailLogic"
import { ApplicationDetailView } from "./detail-view"

export const PageContent = withApplicationDetailLogic(ApplicationDetailView)
