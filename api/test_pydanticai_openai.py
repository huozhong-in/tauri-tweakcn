from openai import AsyncOpenAI
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.profiles import InlineDefsJsonSchemaTransformer
from pydantic_ai.profiles.openai import OpenAIModelProfile
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic import BaseModel, ValidationError, Field
import httpx
from datetime import date
from typing import List, Annotated
from typing_extensions import TypedDict, NotRequired

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

def sync_main():
    class CityLocation(BaseModel):
        city: str = Field(description="The name of the city")
        country: str = Field(description="The name of the country")

    agent = Agent(
        model=model,
        output_type=CityLocation,
    )
    result = agent.run_sync('Where were the olympics held in 2012?')
    print(result.output)
    print(result.usage())

async def embedding() -> List[float]:
    result = await openai_client.embeddings.create(
        model="text-embedding-qwen3-embedding-0.6b",
        input="My name is Ben, I was born on January 28th 1990, I like the chain the dog and the pyramid."
    )
    return result.data[0].embedding

async def main():    
    class UserProfile(TypedDict, total=False):
        name: Annotated[str, Field(description="The user's name")]
        dob: Annotated[date, Field(description="The user's date of birth")]
        bio: Annotated[NotRequired[str], Field(description="The user's biography")]

    normal_agent = Agent(
        model=model,
        output_type=UserProfile,
    )
    user_input = 'My name is Ben, I was born on January 28th 1990, I like the chain the dog and the pyramid.'
    async with normal_agent.run_stream(user_input) as result:
        async for message, last in result.stream_structured(debounce_by=0.05):  
            try:
                profile = await result.validate_structured_output(  
                    message,
                    allow_partial=not last,
                )
            except ValidationError:
                continue
            print(profile)

async def stream_text():
    agent = Agent(
        model=model,
    )
    async with agent.run_stream('说一下第一宇宙速度是什么？') as response:
        # print(await response.get_output())
        async for message in response.stream_text(delta=True):
            print(message)

def test_instruction():
    agent = Agent(
        model=model,
        deps_type=str,
        instructions="Use the customer's name while replying to them.",  
    )

    @agent.instructions  
    def add_the_users_name(ctx: RunContext[str]) -> str:
        return f"The user's name is {ctx.deps}."


    @agent.instructions
    def add_the_date() -> str:  
        return f'The date is {date.today()}.'


    result = agent.run_sync('What is the date?', deps='Frank')
    print(result.output)

def system_prompt_dependencies():
    from dataclasses import dataclass
    @dataclass
    class MyDeps:
        api_key: str
        http_client: httpx.AsyncClient

    agent = Agent(
        model=model,
        deps_type=MyDeps,
    )
    @agent.system_prompt  
    async def get_system_prompt(ctx: RunContext[MyDeps]) -> str:  
        response = await ctx.deps.http_client.get(  
            'https://example.com',
            headers={'Authorization': f'Bearer {ctx.deps.api_key}'},  
        )
        response.raise_for_status()
        return f'Prompt: {response.text}'

    async def main():
        async with httpx.AsyncClient() as client:
            deps = MyDeps('foobar', client)
            result = await agent.run('Tell me a joke.', deps=deps)
            print(result.output)

# import asyncio
# asyncio.run(main())
test_instruction()
