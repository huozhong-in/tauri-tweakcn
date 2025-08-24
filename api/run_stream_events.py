import asyncio
from collections.abc import AsyncIterable
from datetime import date
from typing import Union
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.profiles import InlineDefsJsonSchemaTransformer
from pydantic_ai.profiles.openai import OpenAIModelProfile
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai import Agent
from pydantic_ai.messages import (
    AgentStreamEvent,
    FinalResultEvent,
    FunctionToolCallEvent,
    FunctionToolResultEvent,
    HandleResponseEvent,
    PartDeltaEvent,
    PartStartEvent,
    TextPartDelta,
    ThinkingPartDelta,
    ToolCallPartDelta,
)
from pydantic_ai.tools import RunContext
from openai import AsyncOpenAI
import httpx

base_url='http://localhost:1234/v1'

local_ips = ['localhost', '127.0.0.', '172.16.', '192.168.']
if any(ip in base_url for ip in local_ips):
    http_client = httpx.AsyncClient()
else:
    http_client = httpx.AsyncClient(proxy="http://127.0.0.1:7890")

openai_client = AsyncOpenAI(
    api_key='sk-xxx',
    base_url=base_url,
    max_retries=3,
    http_client=http_client,
)
model = OpenAIModel(
    model_name='google/gemma-3n-e4b',
    provider=OpenAIProvider(
        openai_client=openai_client,
    ),
    profile=OpenAIModelProfile(
        json_schema_transformer=InlineDefsJsonSchemaTransformer,  # Supported by any model class on a plain ModelProfile
        openai_supports_strict_tool_definition=False  # Supported by OpenAIModel only, requires OpenAIModelProfile
    )
)
weather_agent = Agent(
    model=model,
    system_prompt='Providing a weather forecast at the locations the user provides.',
)


@weather_agent.tool
async def weather_forecast(
    ctx: RunContext,
    location: str,
    forecast_date: date,
) -> str:
    return f'The forecast in {location} on {forecast_date} is 24°C and sunny.'


output_messages: list[str] = []


async def event_stream_handler(
    ctx: RunContext,
    event_stream: AsyncIterable[Union[AgentStreamEvent, HandleResponseEvent]],
):
    async for event in event_stream:
        if isinstance(event, PartStartEvent):
            output_messages.append(f'[Request] Starting part {event.index}: {event.part!r}')
        elif isinstance(event, PartDeltaEvent):
            if isinstance(event.delta, TextPartDelta):
                output_messages.append(f'[Request] Part {event.index} text delta: {event.delta.content_delta!r}')
            elif isinstance(event.delta, ThinkingPartDelta):
                output_messages.append(f'[Request] Part {event.index} thinking delta: {event.delta.content_delta!r}')
            elif isinstance(event.delta, ToolCallPartDelta):
                output_messages.append(f'[Request] Part {event.index} args delta: {event.delta.args_delta}')
        elif isinstance(event, FunctionToolCallEvent):
            output_messages.append(
                f'[Tools] The LLM calls tool={event.part.tool_name!r} with args={event.part.args} (tool_call_id={event.part.tool_call_id!r})'
            )
        elif isinstance(event, FunctionToolResultEvent):
            output_messages.append(f'[Tools] Tool call {event.tool_call_id!r} returned => {event.result.content}')
        elif isinstance(event, FinalResultEvent):
            output_messages.append(f'[Result] The model starting producing a final result (tool_name={event.tool_name})')


async def main():
    user_prompt = 'What will the weather be like in Paris on Tuesday?'

    async with weather_agent.run_stream(user_prompt, event_stream_handler=event_stream_handler) as run:
        async for output in run.stream_text():
            output_messages.append(f'[Output] {output}')


if __name__ == '__main__':
    asyncio.run(main())

    print(output_messages)
    """
    [
        "[Request] Starting part 0: ToolCallPart(tool_name='weather_forecast', tool_call_id='0001')",
        '[Request] Part 0 args delta: {"location":"Pa',
        '[Request] Part 0 args delta: ris","forecast_',
        '[Request] Part 0 args delta: date":"2030-01-',
        '[Request] Part 0 args delta: 01"}',
        '[Tools] The LLM calls tool=\'weather_forecast\' with args={"location":"Paris","forecast_date":"2030-01-01"} (tool_call_id=\'0001\')',
        "[Tools] Tool call '0001' returned => The forecast in Paris on 2030-01-01 is 24°C and sunny.",
        "[Request] Starting part 0: TextPart(content='It will be ')",
        '[Result] The model starting producing a final result (tool_name=None)',
        '[Output] It will be ',
        '[Output] It will be warm and sunny ',
        '[Output] It will be warm and sunny in Paris on ',
        '[Output] It will be warm and sunny in Paris on Tuesday.',
    ]
    """