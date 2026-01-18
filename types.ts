import React from 'react';

export interface AnalysisResult {
  riskScore: number;
  verdict: 'SAFE' | 'SUSPICIOUS' | 'FRAUD';
  confidence: number;
  artifactsFound: string[];
  reasoning: string;
  timestamp: string;
}

export interface ScanHistoryItem {
  id: string;
  fileName: string;
  thumbnail?: string;
  result: AnalysisResult;
}

export enum ViewState {
  ANALYZER = 'ANALYZER',
  LIVE_MONITOR = 'LIVE_MONITOR',
  CASE_LOGS = 'CASE_LOGS'
}

export interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}