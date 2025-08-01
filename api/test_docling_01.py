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
    DocTagsDocument,
    ImageRefMode,
    PictureItem,
    TableItem,
)
from docling.datamodel.document import (
    ConversionResult,
)
# from docling.utils.export import generate_multimodal_pages
# from docling.utils.utils import create_hash
import logging
import time
from pathlib import Path
# from random import randint

_log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
IMAGE_RESOLUTION_SCALE = 2.0

def main():
    # Important: For operating with page images, we must keep them, otherwise the DocumentConverter
    # will destroy them for cleaning up memory.
    # This is done by setting PdfPipelineOptions.images_scale, which also defines the scale of images.
    # scale=1 correspond of a standard 72 DPI image
    # The PdfPipelineOptions.generate_* are the selectors for the document elements which will be enriched
    # with the image field
    pipeline_options = PdfPipelineOptions()
    pipeline_options.generate_picture_images = True
    # pipeline_options.generate_page_images = True
    pipeline_options.images_scale = IMAGE_RESOLUTION_SCALE
    pipeline_options.do_picture_description = True
    pipeline_options.enable_remote_services=True  # <-- this is required!
    pipeline_options.picture_description_options = PictureDescriptionApiOptions(
        url="http://localhost:1234/v1/chat/completions",
        params=dict(
            model="google/gemma-3-4b",
            seed=42,  # for reproducibility
            temperature=0.2,
            max_completion_tokens=250,
        ),
        prompt="""
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
    start_time = time.time()
    result: ConversionResult = converter.convert(
        # source="/Users/dio/Downloads/Context Engineering for AI Agents_ Lessons from Building Manus.pdf"
        source="/Users/dio/Downloads/AI代理的上下文工程：构建Manus的经验教训.pdf"
    )
    doc = result.document
    print(f"Document has {len(doc.pages)} pages.")

    output_dir = Path("test_docling_01")
    if not output_dir.exists():
        output_dir.mkdir(parents=True, exist_ok=True)
    doc_filename = result.input.file.stem

    # dump_json_path = Path("./test_docling_01.json")
    # dump_json_path.write_text(result.document.model_dump_json(indent=2))
    # print(result.document.pictures[2].get_annotations()[0].text)

    # export to markdown
    # markdown_path = Path("./test_docling_01.md")
    # markdown_path.write_text(doc.export_to_markdown(
    #     image_mode=ImageRefMode.PLACEHOLDER,
    #     image_placeholder="![{page_number}]{image_url}",
    # ))

    # Save page images
    # for page_no, page in result.document.pages.items():
    #     page_no = page.page_no
    #     page_image_filename = output_dir / f"{doc_filename}-{page_no}.png"
    #     with page_image_filename.open("wb") as fp:
    #         page.image.pil_image.save(fp, format="PNG")

    # Save images of figures and tables
    table_counter = 0
    picture_counter = 0
    for element, _level in result.document.iterate_items():
        if isinstance(element, TableItem):
            table_counter += 1
            element_image_filename = (
                output_dir / f"{doc_filename}-table-{table_counter}.png"
            )
            with element_image_filename.open("wb") as fp:
                element.get_image(result.document).save(fp, "PNG")

        if isinstance(element, PictureItem):
            picture_counter += 1
            element_image_filename = (
                output_dir / f"{doc_filename}-picture-{picture_counter}.png"
            )
            with element_image_filename.open("wb") as fp:
                element.get_image(result.document).save(fp, "PNG")

    # Save markdown with externally referenced pictures
    md_filename = output_dir / f"{doc_filename}-with-image-refs.md"
    result.document.save_as_markdown(
        filename=md_filename, 
        image_mode=ImageRefMode.REFERENCED,
        artifacts_dir=Path(".")
    )

    # Export Document Tags format:
    # result.document.save_as_doctags(
    #     filename=output_dir / f"{doc_filename}.doctags",
    # )
    
    # Save markdown with embedded pictures
    md_filename = output_dir / f"{doc_filename}-with-images.md"
    result.document.save_as_markdown(md_filename, image_mode=ImageRefMode.EMBEDDED)

    # Save markdown with externally referenced pictures
    md_filename = output_dir / f"{doc_filename}-with-image-refs.md"
    result.document.save_as_markdown(md_filename, image_mode=ImageRefMode.REFERENCED)

    # Save HTML with externally referenced pictures
    html_filename = output_dir / f"{doc_filename}-with-image-refs.html"
    result.document.save_as_html(html_filename, image_mode=ImageRefMode.REFERENCED)

    end_time = time.time() - start_time

    _log.info(f"Document converted and figures exported in {end_time:.2f} seconds.")
    
    # import webbrowser
    # webbrowser.open(f"file:///{str(html_filename.resolve())}")

if __name__ == "__main__":
    main()