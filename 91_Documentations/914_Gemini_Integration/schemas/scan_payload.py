from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ClientProfile(BaseModel):
    client_id: Optional[str] = None
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    scan_date: Optional[str] = None
    language: str = "en"


class ClusterSummary(BaseModel):
    score: float = 0
    severity: str = "none"


class ScanPayload(BaseModel):
    client_profile: ClientProfile
    instrument: str = "both"
    flagged_qrma_params: List[Dict[str, Any]] = Field(default_factory=list)
    flagged_gdv_params: List[Dict[str, Any]] = Field(default_factory=list)
    confirmed_correlations: List[Dict[str, Any]] = Field(default_factory=list)
    cluster_a: ClusterSummary = Field(default_factory=ClusterSummary)
    cluster_b: ClusterSummary = Field(default_factory=ClusterSummary)
    cluster_c: ClusterSummary = Field(default_factory=ClusterSummary)
    primary_cluster: str = "none"
    active_clusters: List[str] = Field(default_factory=list)
    matched_patterns: List[Dict[str, Any]] = Field(default_factory=list)
    primary_tcm_pattern: Optional[Dict[str, Any]] = None
    stress_index: Optional[float] = None
    energy_total: Optional[float] = None
    energy_reserve: Optional[float] = None
    lifestyle_scores: Dict[str, Any] = Field(default_factory=dict)
    chakra_alignment: Dict[str, Any] = Field(default_factory=dict)
    red_flags: List[str] = Field(default_factory=list)
    practitioner_note: Optional[str] = None
