"use client";

import { useState } from "react";
import type { AgentResult, AgentType, Claim } from "@/lib/types";
import { OverviewPanel } from "./OverviewPanel";
import { ResearchPanel } from "./ResearchPanel";
import { LegalPanel } from "./LegalPanel";
import { ContinuityPanel } from "./ContinuityPanel";
import { StoryboardPanel } from "./StoryboardPanel";
import { TableReadPanel } from "./TableReadPanel";
import { SchedulePanel } from "./SchedulePanel";
import { StakeholderPanel } from "./StakeholderPanel";
import { RiskDashboard } from "./RiskDashboard";
import { BudgetTrackerPanel } from "./BudgetTrackerPanel";
import { CharacterRelationshipPanel } from "./CharacterRelationshipPanel";
import { ScriptComparePanel } from "./ScriptComparePanel";
import { PitchDeckPanel } from "./PitchDeckPanel";
import { LocationMatchPanel } from "./LocationMatchPanel";
import {
  HiOutlineChartBar,
  HiOutlineMagnifyingGlass,
  HiOutlineShieldCheck,
  HiOutlineLink,
  HiOutlineFilm,
  HiOutlineMicrophone,
  HiOutlineCalendarDays,
  HiOutlineUsers,
  HiOutlineExclamationTriangle,
  HiOutlineCurrencyDollar,
  HiOutlineArrowPath,
  HiOutlineArrowsRightLeft,
  HiOutlinePresentationChartLine,
  HiOutlineMapPin,
} from "react-icons/hi2";

type Tab = "overview" | "research" | "legal" | "continuity" | "storyboard" | "table-read" | "schedule" | "stakeholders" | "risk-dashboard" | "budget" | "relationships" | "script-compare" | "pitch-deck" | "locations";

interface AgentResultsTabsProps {
  agentResults: Record<AgentType, AgentResult>;
  riskScore: number;
  riskLevel: string;
  riskFactors: string[];
  recommendedActions: string[];
  processingTime: number;
  claimsCount: number;
  claims: Claim[];
  reportId?: string;
}

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <HiOutlineChartBar size={18} /> },
  { key: "research", label: "Research", icon: <HiOutlineMagnifyingGlass size={18} /> },
  { key: "legal", label: "Legal", icon: <HiOutlineShieldCheck size={18} /> },
  { key: "continuity", label: "Continuity", icon: <HiOutlineLink size={18} /> },
  { key: "storyboard", label: "Storyboard", icon: <HiOutlineFilm size={18} /> },
  { key: "table-read", label: "Table Read", icon: <HiOutlineMicrophone size={18} /> },
  { key: "schedule", label: "Schedule", icon: <HiOutlineCalendarDays size={18} /> },
  { key: "stakeholders", label: "Stakeholders", icon: <HiOutlineUsers size={18} /> },
  { key: "risk-dashboard", label: "Risk Dashboard", icon: <HiOutlineExclamationTriangle size={18} /> },
  { key: "budget", label: "Budget", icon: <HiOutlineCurrencyDollar size={18} /> },
  { key: "relationships", label: "Relationships", icon: <HiOutlineArrowPath size={18} /> },
  { key: "script-compare", label: "Compare", icon: <HiOutlineArrowsRightLeft size={18} /> },
  { key: "pitch-deck", label: "Pitch Deck", icon: <HiOutlinePresentationChartLine size={18} /> },
  { key: "locations", label: "Locations", icon: <HiOutlineMapPin size={18} /> },
];

export function AgentResultsTabs({
  agentResults,
  riskScore,
  riskLevel,
  riskFactors,
  recommendedActions,
  processingTime,
  claimsCount,
  claims,
  reportId,
}: AgentResultsTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const hidePanel = { display: "none" };
  const showPanel = { display: "block" };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Tab headers */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content - all panels rendered, hidden/shown via CSS to preserve state */}
      <div className="p-5">
        <div style={activeTab === "overview" ? showPanel : hidePanel}>
          <OverviewPanel
            riskScore={riskScore}
            riskLevel={riskLevel}
            riskFactors={riskFactors}
            recommendedActions={recommendedActions}
            agentResults={agentResults}
            processingTime={processingTime}
            claimsCount={claimsCount}
          />
        </div>
        <div style={activeTab === "research" ? showPanel : hidePanel}>
          <ResearchPanel agentResult={agentResults.research ?? null} claims={claims} />
        </div>
        <div style={activeTab === "legal" ? showPanel : hidePanel}>
          <LegalPanel agentResult={agentResults.legal ?? null} />
        </div>
        <div style={activeTab === "continuity" ? showPanel : hidePanel}>
          <ContinuityPanel agentResult={agentResults.continuity ?? null} />
        </div>
        <div style={activeTab === "storyboard" ? showPanel : hidePanel}>
          {reportId ? (
            <StoryboardPanel reportId={reportId} />
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Report ID required for storyboard generation
            </div>
          )}
        </div>
        <div style={activeTab === "table-read" ? showPanel : hidePanel}>
          {reportId ? (
            <TableReadPanel reportId={reportId} />
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Report ID required for table read generation
            </div>
          )}
        </div>
        <div style={activeTab === "schedule" ? showPanel : hidePanel}>
          {reportId ? (
            <SchedulePanel reportId={reportId} />
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Report ID required for schedule generation
            </div>
          )}
        </div>
        <div style={activeTab === "stakeholders" ? showPanel : hidePanel}>
          {reportId ? (
            <StakeholderPanel reportId={reportId} />
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Report ID required for stakeholder analysis
            </div>
          )}
        </div>
        <div style={activeTab === "risk-dashboard" ? showPanel : hidePanel}>
          {reportId ? (
            <RiskDashboard reportId={reportId} />
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Report ID required for risk dashboard
            </div>
          )}
        </div>
        <div style={activeTab === "budget" ? showPanel : hidePanel}>
          {reportId ? (
            <BudgetTrackerPanel reportId={reportId} />
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Report ID required for budget tracking
            </div>
          )}
        </div>
        <div style={activeTab === "relationships" ? showPanel : hidePanel}>
          {reportId ? (
            <CharacterRelationshipPanel reportId={reportId} />
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Report ID required for relationship graph
            </div>
          )}
        </div>
        <div style={activeTab === "script-compare" ? showPanel : hidePanel}>
          <ScriptComparePanel reportId={reportId} />
        </div>
        <div style={activeTab === "pitch-deck" ? showPanel : hidePanel}>
          {reportId ? (
            <PitchDeckPanel reportId={reportId} />
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Report ID required for pitch deck
            </div>
          )}
        </div>
        <div style={activeTab === "locations" ? showPanel : hidePanel}>
          {reportId ? (
            <LocationMatchPanel reportId={reportId} />
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Report ID required for location matching
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
