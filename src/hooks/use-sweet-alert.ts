import { sweetAlert } from '@/services/sweetalert.service';

export const useSweetAlert = () => {
  return {
    success: sweetAlert.success.bind(sweetAlert),
    error: sweetAlert.error.bind(sweetAlert),
    info: sweetAlert.info.bind(sweetAlert),
    warning: sweetAlert.warning.bind(sweetAlert),
    confirm: sweetAlert.confirm.bind(sweetAlert),
    loading: sweetAlert.loading.bind(sweetAlert),
    closeLoading: sweetAlert.closeLoading.bind(sweetAlert),
    modal: sweetAlert.modal.bind(sweetAlert),
    form: sweetAlert.form.bind(sweetAlert),
  };
}; 