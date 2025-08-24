from deferred_toolset_agent import agent, PersonalizedGreeting

from typing import Union

from pydantic_ai.output import DeferredToolCalls
from pydantic_ai.tools import ToolDefinition
from pydantic_ai.toolsets import DeferredToolset
from pydantic_ai.messages import ModelMessage

def run_agent(
    messages: list[ModelMessage] = [], frontend_tools: list[ToolDefinition] = {}
) -> tuple[Union[PersonalizedGreeting, DeferredToolCalls], list[ModelMessage]]:
    deferred_toolset = DeferredToolset(frontend_tools)
    result = agent.run_sync(
        toolsets=[deferred_toolset], 
        output_type=[agent.output_type, DeferredToolCalls], 
        message_history=messages, 
    )
    return result.output, result.new_messages()