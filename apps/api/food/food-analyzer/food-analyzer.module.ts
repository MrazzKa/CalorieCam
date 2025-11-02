import { Module } from '@nestjs/common';
import { FoodAnalyzerService } from './food-analyzer.service';
import { OpenAiAnalyzer } from './analyzers/openai.analyzer';
import { UsdaAnalyzer } from './analyzers/usda.analyzer';
import { RagAnalyzer } from './analyzers/rag.analyzer';
import { HybridAnalyzer } from './analyzers/hybrid.analyzer';
import { FdcModule } from '../../src/fdc/fdc.module';

@Module({
  imports: [FdcModule],
  providers: [
    FoodAnalyzerService,
    OpenAiAnalyzer,
    UsdaAnalyzer,
    RagAnalyzer,
    HybridAnalyzer,
  ],
  exports: [FoodAnalyzerService],
})
export class FoodAnalyzerModule {}
