interface CreateMonitorInterface {
  source: string;
  description: string;
  aoi_geojson: {
    type: string;
    coordinates: number[][][];
  };
  match_criteria: {
    platform: {
      in: string[];
    };
    "eo:cloud_cover"?: {
      [operator: string]: number;
    };
    "view:off_nadir"?: {
      [operator: string]: number;
    };
    "aoi:coverage_pct"?: {
      [operator: string]: number;
    };
  };
  metadata: {
    store_name: string,
    address?: string,
    market_segment?: string,
    creator_key: string | null
  }
}