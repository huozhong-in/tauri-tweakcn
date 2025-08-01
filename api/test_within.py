'''
pip install docling 
pip uninstall mlx-vlm

pip install docling[vlm]
OR
pip install mlx-vlm==0.1.27
'''

from docling.datamodel import vlm_model_specs
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    VlmPipelineOptions,
)
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.pipeline.vlm_pipeline import VlmPipeline
from docling_core.types.doc import (
    DoclingDocument,
    ImageRefMode,
    DocTagsDocument,
)
import pathlib

# source = "https://arxiv.org/pdf/2501.17887"
# source = pathlib.Path("/Users/dio/Downloads/Context Engineering for AI Agents_ Lessons from Building Manus.pdf")
source = pathlib.Path("/Users/dio/Downloads/AI代理的上下文工程：构建Manus的经验教训.pdf")

pipeline_options = VlmPipelineOptions(
    vlm_options=vlm_model_specs.SMOLDOCLING_MLX, # ! 495M，但中文拉胯
    # vlm_options=vlm_model_specs.QWEN25_VL_3B_MLX, # ! 太大了，高达7G
    # generate_picture_images = True,
    # images_scale = 2.0,
)

converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_options=pipeline_options,
            pipeline_cls=VlmPipeline,
        ),
    }
)
doc = converter.convert(source=source).document
markdown_path = pathlib.Path("./test_within.md")
markdown_path.write_text(doc.export_to_markdown(image_mode=ImageRefMode.PLACEHOLDER))
print("Markdown saved to:", markdown_path)
