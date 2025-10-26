import { Module } from '@nestjs/common';
import { FoodAnalyzerService } from './food-analyzer.service';
import { OpenAiAnalyzer } from './analyzers/openai.analyzer';
import { UsdaAnalyzer } from './analyzers/usda.analyzer';
import { HybridAnalyzer } from './analyzers/hybrid.analyzer';

@Module({
  providers: [
    FoodAnalyzerService,
    OpenAiAnalyzer,
    UsdaAnalyzer,
    HybridAnalyzer,
  ],
  exports: [FoodAnalyzerService],
})
export class FoodAnalyzerModule {}
