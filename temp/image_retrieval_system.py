"""
多模态图片检索系统
支持批量图片索引和文本查询检索
"""

import mlx.core as mx
from mlx_embeddings.utils import load
import numpy as np
from PIL import Image
import json
import os
from typing import List, Dict, Tuple
import pickle

class MultimodalRetrievalSystem:
    def __init__(self, model_path="./colqwen2.5-v0.2-mlx"):
        """初始化检索系统"""
        print("Loading multimodal model...")
        self.model, self.processor = load(model_path)
        self.image_database = []
        self.embeddings_cache = {}
        print("Model loaded successfully!")
    
    def _process_image(self, image_path: str) -> mx.array:
        """处理单张图片，返回嵌入向量"""
        try:
            # 加载和预处理图片
            image = Image.open(image_path).convert('RGB').resize((224, 224))
            
            # 使用与late_interaction.py相同的图片处理逻辑
            from transformers import AutoImageProcessor
            image_processor = AutoImageProcessor.from_pretrained("./colqwen2.5-v0.2-mlx", use_fast=True)
            
            processed_images = image_processor(images=[image], return_tensors="pt")
            pixel_values = mx.array(processed_images['pixel_values'])
            
            # 创建image_grid_thw
            image_grid_thw = mx.array([[1, 28, 28]])
            
            # 获取图片特征
            image_features = self.model.get_image_features(pixel_values, image_grid_thw)
            
            # 创建mock输入
            image_token_id = 151655
            image_input_ids = mx.full((1, 64), image_token_id, dtype=mx.int32)
            
            if isinstance(processed_images['pixel_values'], torch.Tensor):
                pixel_values = mx.array(processed_images['pixel_values'].numpy())
            else:
                pixel_values = mx.array(processed_images['pixel_values'])
            
            # 生成图片嵌入
            image_embeddings = self.model(
                input_ids=image_input_ids,
                pixel_values=pixel_values,
                image_grid_thw=image_grid_thw
            )
            
            return np.array(image_embeddings.image_embeds)  # (1, 64, 128)
            
        except Exception as e:
            print(f"Error processing image {image_path}: {e}")
            return None
    
    def build_image_index(self, image_directory: str, save_path: str = "image_index.pkl"):
        """批量构建图片索引"""
        print(f"Building image index from {image_directory}...")
        
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
        image_files = [
            os.path.join(image_directory, f) 
            for f in os.listdir(image_directory)
            if os.path.splitext(f.lower())[1] in image_extensions
        ]
        
        print(f"Found {len(image_files)} images to process...")
        
        for i, image_path in enumerate(image_files):
            print(f"Processing {i+1}/{len(image_files)}: {os.path.basename(image_path)}")
            
            embedding = self._process_image(image_path)
            if embedding is not None:
                self.image_database.append({
                    'path': image_path,
                    'filename': os.path.basename(image_path),
                    'embedding': embedding.squeeze(0),  # (64, 128)
                })
        
        # 保存索引
        with open(save_path, 'wb') as f:
            pickle.dump(self.image_database, f)
        
        print(f"Image index built successfully! {len(self.image_database)} images indexed.")
        print(f"Index saved to {save_path}")
    
    def load_image_index(self, index_path: str = "image_index.pkl"):
        """加载预构建的图片索引"""
        try:
            with open(index_path, 'rb') as f:
                self.image_database = pickle.load(f)
            print(f"Loaded image index with {len(self.image_database)} images")
        except FileNotFoundError:
            print(f"Index file {index_path} not found. Please build index first.")
    
    def search_images(self, query_text: str, top_k: int = 10, score_threshold: float = 2.0) -> List[Dict]:
        """文本查询检索图片"""
        if not self.image_database:
            print("No image index loaded. Please build or load an index first.")
            return []
        
        print(f"Searching for: '{query_text}'")
        
        # 处理查询文本
        text_inputs = self.processor(text=[query_text], padding=True, return_tensors="pt")
        text_input_ids = mx.array(text_inputs.input_ids)
        
        # 生成文本嵌入
        text_embeddings = self.model(input_ids=text_input_ids)
        text_embed = np.array(text_embeddings.text_embeds).squeeze(0)  # (8, 128)
        
        # 计算与所有图片的相似度
        results = []
        for item in self.image_database:
            image_embed = item['embedding']  # (64, 128)
            
            # Late interaction相似度计算
            token_similarities = np.dot(text_embed, image_embed.T)  # (8, 64)
            max_similarities = np.max(token_similarities, axis=1)  # (8,)
            final_score = np.sum(max_similarities)  # scalar
            
            if final_score >= score_threshold:
                results.append({
                    'path': item['path'],
                    'filename': item['filename'],
                    'score': final_score
                })
        
        # 按分数排序
        results.sort(key=lambda x: x['score'], reverse=True)
        
        # 返回前top_k个结果
        top_results = results[:top_k]
        
        print(f"Found {len(results)} images above threshold {score_threshold}")
        print(f"Returning top {len(top_results)} results:")
        for i, result in enumerate(top_results):
            print(f"  {i+1}. {result['filename']}: {result['score']:.4f}")
        
        return top_results
    
    def evaluate_threshold(self, test_queries: List[str], thresholds: List[float]):
        """评估不同阈值的效果"""
        print("Evaluating different thresholds...")
        
        for threshold in thresholds:
            total_results = 0
            for query in test_queries:
                results = self.search_images(query, top_k=100, score_threshold=threshold)
                total_results += len(results)
            
            avg_results = total_results / len(test_queries)
            print(f"Threshold {threshold}: Average {avg_results:.1f} results per query")

# 使用示例
if __name__ == "__main__":
    import torch
    
    # 初始化系统
    retrieval_system = MultimodalRetrievalSystem()
    
    # 构建图片索引（首次运行）
    # retrieval_system.build_image_index("./image_collection", "my_image_index.pkl")
    
    # 加载预构建的索引
    # retrieval_system.load_image_index("my_image_index.pkl")
    
    # 查询示例
    queries = [
        "a cat sitting on a chair",
        "books on a shelf",
        "evaluation results chart",
        "historical document"
    ]
    
    for query in queries:
        print(f"\n{'='*50}")
        results = retrieval_system.search_images(query, top_k=5, score_threshold=2.0)
        
        if results:
            print(f"Top results for '{query}':")
            for i, result in enumerate(results):
                print(f"  {i+1}. {result['filename']} (score: {result['score']:.4f})")
        else:
            print(f"No results found for '{query}'")
    
    # 阈值评估
    print(f"\n{'='*50}")
    retrieval_system.evaluate_threshold(queries, [1.5, 2.0, 2.5, 3.0])
