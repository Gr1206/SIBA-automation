from typing import Literal

from pydantic import BaseModel, ConfigDict


class SubmissionResolutionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    decision: Literal["accepted", "not_received"]
