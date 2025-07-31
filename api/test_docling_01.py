from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PictureDescriptionApiOptions,
    PdfPipelineOptions,
)
from docling.document_converter import (
    DocumentConverter, 
    PdfFormatOption,
    )
from docling_core.types.doc import (
    DoclingDocument,
    ImageRefMode,
    DocTagsDocument,
)
from docling.datamodel.document import (
    ConversionResult,
)
import pathlib
from random import randint

pipeline_options = PdfPipelineOptions()
pipeline_options.do_picture_description = True
# pipeline_options.generate_picture_images = True
# pipeline_options.generate_page_images = True
pipeline_options.enable_remote_services=True  # Enable connections to remote services <-- this is required!
pipeline_options.picture_description_options = PictureDescriptionApiOptions(
    url="http://localhost:1234/v1/chat/completions",
    params=dict(
        model="qwen/qwen2.5-vl-7b",
        seed= randint(0, 1000000),  # for reproducibility
        temperature=0.2,
        max_completion_tokens=250,
    ),
    prompt = """
You are an assistant tasked with summarizing images for retrieval. 
These summaries will be embedded and used to retrieve the raw image. 
Give a concise summary of the image that is well optimized for retrieval.
""".strip(),
    timeout=90,
)

converter = DocumentConverter(format_options={
    InputFormat.PDF: PdfFormatOption(
        pipeline_options=pipeline_options,
    )
})

result: ConversionResult = converter.convert(
    source="/Users/dio/Downloads/Context Engineering for AI Agents_ Lessons from Building Manus.pdf"
)
dump_json_path = pathlib.Path("./test_docling_01.json")
dump_json_path.write_text(result.document.model_dump_json())
# print(result.document.pictures[2].get_annotations()[0].text)

doc = result.document
print(f"Document has {len(doc.pages)} pages.")
# export to markdown
markdown_path = pathlib.Path("./test_docling_01.md")
markdown_path.write_text(doc.export_to_markdown(image_mode=ImageRefMode.REFERENCED))
