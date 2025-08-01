import logging
from pathlib import Path

# from docling_core.types.doc.page import SegmentedPage
from dotenv import load_dotenv
from docling_core.types.doc import (
    DoclingDocument,
    ImageRefMode,
    DocTagsDocument,
    PictureItem,
)
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    VlmPipelineOptions,
)
from docling.datamodel.pipeline_options_vlm_model import ApiVlmOptions, ResponseFormat
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.pipeline.vlm_pipeline import VlmPipeline
from docling.datamodel.settings import (
    PageRange,
)
from random import randint

def lms_vlm_options(model: str, prompt: str, format: ResponseFormat):
    options = ApiVlmOptions(
        url="http://127.0.0.1:1234/v1/chat/completions",  # the default LM Studio
        params=dict(
            model=model,
        ),
        prompt=prompt,
        timeout=90,
        scale=1.0,
        response_format=format,
    )
    return options

# def lms_olmocr_vlm_options(model: str):
#     def _dynamic_olmocr_prompt(page: Optional[SegmentedPage]):
#         if page is None:
#             return (
#                 "Below is the image of one page of a document. Just return the plain text"
#                 " representation of this document as if you were reading it naturally.\n"
#                 "Do not hallucinate.\n"
#             )

#         anchor = [
#             f"Page dimensions: {int(page.dimension.width)}x{int(page.dimension.height)}"
#         ]

#         for text_cell in page.textline_cells:
#             if not text_cell.text.strip():
#                 continue
#             bbox = text_cell.rect.to_bounding_box().to_bottom_left_origin(
#                 page.dimension.height
#             )
#             anchor.append(f"[{int(bbox.l)}x{int(bbox.b)}] {text_cell.text}")

#         for image_cell in page.bitmap_resources:
#             bbox = image_cell.rect.to_bounding_box().to_bottom_left_origin(
#                 page.dimension.height
#             )
#             anchor.append(
#                 f"[Image {int(bbox.l)}x{int(bbox.b)} to {int(bbox.r)}x{int(bbox.t)}]"
#             )

#         if len(anchor) == 1:
#             anchor.append(
#                 f"[Image 0x0 to {int(page.dimension.width)}x{int(page.dimension.height)}]"
#             )

#         # Original prompt uses cells sorting. We are skipping it in this demo.

#         base_text = "\n".join(anchor)

#         return (
#             f"Below is the image of one page of a document, as well as some raw textual"
#             f" content that was previously extracted for it. Just return the plain text"
#             f" representation of this document as if you were reading it naturally.\n"
#             f"Do not hallucinate.\n"
#             f"RAW_TEXT_START\n{base_text}\nRAW_TEXT_END"
#         )

#     options = ApiVlmOptions(
#         url="http://127.0.0.1:1234/v1/chat/completions",
#         params=dict(
#             model=model,
#         ),
#         prompt=_dynamic_olmocr_prompt,
#         timeout=90,
#         scale=1.0,
#         max_size=1024,  # from OlmOcr pipeline
#         response_format=ResponseFormat.MARKDOWN,
#     )
#     return options

def ollama_vlm_options(model: str, prompt: str):
    options = ApiVlmOptions(
        url="http://127.0.0.1:11434/v1/chat/completions",  # the default Ollama endpoint
        params=dict(
            model=model,
        ),
        prompt=prompt,
        timeout=90,
        scale=1.0,
        response_format=ResponseFormat.MARKDOWN,
    )
    return options

def main():
    logging.basicConfig(level=logging.INFO)

    input_doc_path = Path("/Users/dio/Downloads/AI代理的上下文工程：构建Manus的经验教训.pdf")
    # input_doc_path = Path("./layout-parser-paper.pdf")
    if not input_doc_path.exists():
        raise FileNotFoundError(f"Input document not found: {input_doc_path}")

    pipeline_options = VlmPipelineOptions(
        enable_remote_services=True,  # <-- this is required!
        # generate_picture_images = True,
        # generate_page_images = True,
        # images_scale = 2.0,
    )

    # The ApiVlmOptions() allows to interface with APIs supporting
    # the multi-modal chat interface. Here follow a few example on how to configure those.

    # One possibility is self-hosting model, e.g. via LM Studio, Ollama or others.

    # Example using the SmolDocling model with LM Studio:
    # (uncomment the following lines)
    # pipeline_options.vlm_options = lms_vlm_options(
    #     model="smoldocling-256m-preview-mlx",
    #     prompt="Convert this page to docling.",
    #     format=ResponseFormat.DOCTAGS,
    # )

    # Example using the Granite Vision model with LM Studio:
    # (uncomment the following lines)
    pipeline_options.vlm_options = lms_vlm_options(
        model="google/gemma-3-4b",
        # model="qwen/qwen2.5-vl-7b",
        prompt="OCR the full page to markdown.",
        format=ResponseFormat.MARKDOWN,
    ) 
    # ! 结果是中文PDF解析到一半出错了

    # Example using the OlmOcr (dynamic prompt) model with LM Studio:
    # (uncomment the following lines)
    # pipeline_options.vlm_options = lms_olmocr_vlm_options(
    #     model="hf.co/lmstudio-community/olmOCR-7B-0225-preview-GGUF",
    # )

    # Example using the Granite Vision model with Ollama:
    # (uncomment the following lines)
    # pipeline_options.vlm_options = ollama_vlm_options(
    #     model="granite3.2-vision:2b",
    #     prompt="OCR the full page to markdown.",
    # )

    # Create the DocumentConverter and launch the conversion.
    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options,
                pipeline_cls=VlmPipeline,
            )
        }
    )
    page_range: PageRange = (1, 4)
    result = doc_converter.convert(
        input_doc_path, 
        page_range=page_range
    )
    markdown_path = Path("./test_withapi.md")
    result.document.save_as_markdown(
        filename=markdown_path, 
        image_mode=ImageRefMode.PLACEHOLDER,
        artifacts_dir=Path(".")
    )


if __name__ == "__main__":
    main()