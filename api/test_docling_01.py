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
import logging
import time
from pathlib import Path

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
    pipeline_options.generate_table_images = True
    # pipeline_options.generate_page_images = True
    pipeline_options.images_scale = IMAGE_RESOLUTION_SCALE
    pipeline_options.do_picture_description = True
    pipeline_options.enable_remote_services=True  # <-- this is required!
    pipeline_options.picture_description_options = PictureDescriptionApiOptions(
        url="http://localhost:1234/v1/chat/completions",
        params=dict(
            model="google/gemma-3-4b",
            # model="mlx-community/qwen2.5-vl-7b-instruct",
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
        # source=Path("layout-parser-paper.pdf"),
    )
    doc: DoclingDocument = result.document
    print(f"Document has {len(doc.pages)} pages.")

    output_dir = Path("test_docling_01")
    if not output_dir.exists():
        output_dir.mkdir(parents=True, exist_ok=True)
    doc_filename = result.input.file.stem

    print(len(result.document.pictures), "pictures found in the document.")
    picture_3 = result.document.pictures[2]
    print(picture_3.prov[0].page_no, "is the page number of picture 3.")
    print(picture_3.image.model_dump_json(indent=2, exclude=["uri"]))
    '''
    "image": {
        "mimetype": "image/png",
        "dpi": 144,
        "size": {
          "width": 853.0,
          "height": 414.0
        },
        "uri": "data:image/png;base64,..."
    }
    '''
    print(picture_3.get_annotations()[0].text)
    dump_json_path = output_dir / "test_docling_01.json"
    result.document.save_as_json(
        filename=dump_json_path,
        indent=2,
        image_mode=ImageRefMode.REFERENCED, # "uri": "test_docling_01/image_000003_ac172f3.png"
        artifacts_dir=Path(".")
    )

    # Save page images，也就是把整页存为一张图片
    # for page_no, page in result.document.pages.items():
    #     page_no = page.page_no
    #     page_image_filename = output_dir / f"{doc_filename}-{page_no}.png"
    #     with page_image_filename.open("wb") as fp:
    #         page.image.pil_image.save(fp, format="PNG")

    # Save images of figures and tables
    table_counter = 0
    picture_counter = 0
    for element, _ in result.document.iterate_items():
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

    # Export Document Tags format:
    # result.document.save_as_doctags(
    #     filename=output_dir / f"{doc_filename}.doctags",
    # )
    
    # Save markdown with embedded pictures
    md_filename = output_dir / f"{doc_filename}-with-images-base64.md"
    result.document.save_as_markdown(md_filename, image_mode=ImageRefMode.EMBEDDED)

    # Save markdown with externally referenced pictures
    md_filename = output_dir / f"{doc_filename}-with-image-refs.md"
    result.document.save_as_markdown(
        filename=md_filename, 
        image_mode=ImageRefMode.REFERENCED,
        artifacts_dir=Path(".")
    )
    # OR: export to markdown
    markdown_path = output_dir / f"{doc_filename}-without-annotations.md"
    markdown_path.write_text(doc.export_to_markdown(
        image_mode=ImageRefMode.PLACEHOLDER,
        image_placeholder="<!-- image -->",
        # include_annotations=False,
        mark_annotations=True,
    ))

    # Save HTML with externally referenced pictures
    # html_filename = output_dir / f"{doc_filename}-with-image-refs.html"
    # result.document.save_as_html(html_filename, image_mode=ImageRefMode.REFERENCED)

    end_time = time.time() - start_time

    _log.info(f"Document converted and figures exported in {end_time:.2f} seconds.")
    
    # import webbrowser
    # webbrowser.open(f"file:///{str(html_filename.resolve())}")

if __name__ == "__main__":
    main()