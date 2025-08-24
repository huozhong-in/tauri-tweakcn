from deferred_toolset_api import run_agent

from pydantic_ai.messages import ModelMessage, ModelRequest, RetryPromptPart, ToolReturnPart, UserPromptPart
from pydantic_ai.tools import ToolDefinition
from pydantic_ai.output import DeferredToolCalls

frontend_tool_definitions = [
    ToolDefinition(
        name='get_preferred_language',
        parameters_json_schema={
            'type': 'object', 
            'properties': {'default_language': {'type': 'string'}},
            'required': ['default_language']
        },
        description="Get the user's preferred language from their browser, usually en-US zh-CN ...",
    )
]

def get_preferred_language(default_language: str) -> str:
    print(default_language)
    # return 'zh-CN'
    return 'es-MX'

frontend_tool_functions = {'get_preferred_language': get_preferred_language}

messages: list[ModelMessage] = [
    ModelRequest(
        parts=[
            UserPromptPart(content='Greet the user in a personalized way')
        ]
    )
]

final_output = None
while True:
    output, new_messages = run_agent(messages, frontend_tool_definitions)
    messages += new_messages

    if not isinstance(output, DeferredToolCalls):
        final_output = output
        break

    print(output.tool_calls)
    """
    [
        ToolCallPart(
            tool_name='get_preferred_language',
            args={'default_language': 'en-US'},
            tool_call_id='pyd_ai_tool_call_id',
        )
    ]
    """
    for tool_call in output.tool_calls:
        if function := frontend_tool_functions.get(tool_call.tool_name):
            try:
                content = function(**tool_call.args_as_dict())
            except Exception as e:
                print(f"Error occurred while parsing {tool_call} parameters: {e}")
                content = 'en-US'
            part = ToolReturnPart(
                tool_name=tool_call.tool_name,
                content=content,
                tool_call_id=tool_call.tool_call_id,
            )
        else:
            part = RetryPromptPart(
                tool_name=tool_call.tool_name,
                content=f'Unknown tool {tool_call.tool_name!r}',
                tool_call_id=tool_call.tool_call_id,
            )
        messages.append(ModelRequest(parts=[part]))

print(repr(final_output))
"""
PersonalizedGreeting(greeting='Hola, David! Espero que tengas un gran día!', language_code='es-MX')
"""