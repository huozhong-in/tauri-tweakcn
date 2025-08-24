from openai import OpenAI
 
client = OpenAI(
    base_url="http://localhost:1234/v1",
    api_key="lm_studio"
)
 
response = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "用中文解释 MXFP4 quantization 是什么。"}
    ]
)
 
print(response.choices[0].message.content)
