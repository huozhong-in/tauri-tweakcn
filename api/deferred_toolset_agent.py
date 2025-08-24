import httpx
from pydantic import BaseModel, ValidationError, Field
from openai import AsyncOpenAI
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.profiles import InlineDefsJsonSchemaTransformer
from pydantic_ai.profiles.openai import OpenAIModelProfile
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.toolsets.function import FunctionToolset

http_client = httpx.AsyncClient()
openai_client = AsyncOpenAI(
    api_key='sk-xxx',
    base_url='http://localhost:1234/v1',
    max_retries=3,
    http_client=http_client,
)
model = OpenAIModel(
    # model_name='google/gemma-3n-e4b',  # fail
    # model_name='qwen/qwen3-30b-a3b-2507',  # success
    # model_name='gemma-3-270m-it-qat-mlx',  # fail
    # model_name='google/gemma-3-4b',  # fail
    model_name='qwen/qwen2.5-vl-7b',  # success
    # model_name='mlx-community/qwen2.5-vl-7b-instruct',  # fail
    provider=OpenAIProvider(
        openai_client=openai_client,
    ),
    profile=OpenAIModelProfile(
        json_schema_transformer=InlineDefsJsonSchemaTransformer,  # Supported by any model class on a plain ModelProfile
        openai_supports_strict_tool_definition=False  # Supported by OpenAIModel only, requires OpenAIModelProfile
    )
)

toolset = FunctionToolset()

@toolset.tool
def get_default_language():
    return 'en-US'

@toolset.tool
def get_user_name():
    return 'David'

class PersonalizedGreeting(BaseModel):
    greeting: str
    language_code: str

agent = Agent(
    model=model,
    toolsets=[toolset], 
    output_type=PersonalizedGreeting,
)

result = agent.run_sync('Greet the user in a personalized way')
print(repr(result.output))
