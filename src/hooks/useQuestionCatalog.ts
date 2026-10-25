import { useEffect, useMemo, useState } from 'react';
import {
  getActiveQuestionnaireQuestions,
  getAllCatalogQuestionsForDisplay,
  getCatalogModificationSummary,
  getQuestionCatalogRepository,
  subscribeQuestionCatalog,
} from '../services/questionCatalogService';

export function useQuestionCatalog() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeQuestionCatalog(() => {
      setVersion((v) => v + 1);
    });

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes('question_catalog')) {
        setVersion((v) => v + 1);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
    };
  }, []);

  const partitions = useMemo(
    () => getQuestionCatalogRepository().listCategoryPartitions(),
    [version]
  );

  const activeQuestions = useMemo(
    () => getActiveQuestionnaireQuestions(),
    [version]
  );

  const allDisplayQuestions = useMemo(
    () =>
      getAllCatalogQuestionsForDisplay({
        includeDisabled: true,
        includeArchived: true,
      }),
    [version]
  );

  const modificationSummary = useMemo(
    () => getCatalogModificationSummary(),
    [version]
  );

  return {
    version,
    partitions,
    activeQuestions,
    allDisplayQuestions,
    modificationSummary,
    refresh: () => setVersion((v) => v + 1),
  };
}
