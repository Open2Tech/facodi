import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PageState } from '@/components/layout/PageState';

export default function NotFound() {
  const { t } = useTranslation();
  return <><PageState title={t('common.notFound')} description={t('common.notFoundDescription')} /><Button asChild><Link to="/courses">{t('home.explore')}</Link></Button></>;
}
