import React from 'react';
import { SimulationProject } from '../../../models/ikpa';
import { InterfaceTab } from './InterfaceTab';

export interface DashboardTabProps {
  project: SimulationProject;
  onNavigateTab: (tabId: any) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

export const DashboardTab: React.FC<DashboardTabProps> = (props) => {
  return <InterfaceTab {...props} />;
};
