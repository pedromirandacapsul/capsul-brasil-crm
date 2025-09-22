export interface FeatureFlag {
  id: string
  name: string
  description: string | null
  enabled: boolean
  config: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
}

export type FeatureFlagName =
  | 'ads_integration'
  | 'auto_lead_scoring'
  | 'advanced_pipeline'
  | 'inbox_whatsapp'
  | 'inbox_email'
  | 'workflow_automation'
  | 'calendar_integration'
  | 'heatmap_tracking'
  | 'internal_chat'
  | 'email_campaigns'
  | 'sales_celebration'

export interface FeatureFlagConfig {
  [key: string]: any
}

export interface CreateFeatureFlagInput {
  name: FeatureFlagName
  description?: string
  enabled?: boolean
  config?: FeatureFlagConfig
}

export interface UpdateFeatureFlagInput {
  description?: string
  enabled?: boolean
  config?: FeatureFlagConfig
}