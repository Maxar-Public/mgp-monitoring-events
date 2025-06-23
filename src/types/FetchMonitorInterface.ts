export interface Monitor {
  id: string;
  date_created: string;
  date_modified: string;
  creator_id: string;
  creator_group_id: string;
  source: string;
  description: string;
  start_datetime: string | null;
  end_datetime: string | null;
  aoi_geojson?: {
    type: string;
    coordinates: [number, number][][]; 
  };
  match_criteria?: {
    "eo:cloud_cover"?: { eq: number };
    "view:off_nadir"?: { eq: number };
    platform?: { in: string[] };
  };
  erode_area: boolean;
  erosion_complete_threshold_pct: number;
  order_when_complete: boolean;
  order_templates: any | null;
  batch_order_templates: any | null;
  monitor_notifications: any | null;
  enabled: boolean;
  metadata: {
    store_name: string;
    market_segment?: string;
    address: string;
  };
  monitor_links: {
    self: string;
    events: string;
  };
}