import Swal from 'sweetalert2';

interface ConfirmDialogOptions {
  title?: string;
  text?: string;
  icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
}

class SweetAlertService {
  // Success Toast
  success(message: string, title: string = 'Success') {
    return Swal.fire({
      title,
      text: message,
      icon: 'success',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }

  // Error Toast
  error(message: string, title: string = 'Error') {
    return Swal.fire({
      title,
      text: message,
      icon: 'error',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }

  // Info Toast
  info(message: string, title: string = 'Info') {
    return Swal.fire({
      title,
      text: message,
      icon: 'info',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }

  // Warning Toast
  warning(message: string, title: string = 'Warning') {
    return Swal.fire({
      title,
      text: message,
      icon: 'warning',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }

  // Confirmation Dialog
  async confirm({
    title = 'Are you sure?',
    text = 'This action cannot be undone.',
    icon = 'warning',
    confirmButtonText = 'Yes',
    cancelButtonText = 'Cancel',
    showCancelButton = true,
  }: ConfirmDialogOptions = {}) {
    const result = await Swal.fire({
      title,
      text,
      icon,
      showCancelButton,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText,
      cancelButtonText,
    });

    return result.isConfirmed;
  }

  // Loading Dialog
  loading(title: string = 'Loading...') {
    return Swal.fire({
      title,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  }

  // Close Loading Dialog
  closeLoading() {
    Swal.close();
  }

  // Custom Modal
  modal({
    title,
    html,
    showConfirmButton = true,
    confirmButtonText = 'OK',
    showCancelButton = false,
    cancelButtonText = 'Cancel',
    width = '32rem',
  }: {
    title: string;
    html: string;
    showConfirmButton?: boolean;
    confirmButtonText?: string;
    showCancelButton?: boolean;
    cancelButtonText?: string;
    width?: string;
  }) {
    return Swal.fire({
      title,
      html,
      showConfirmButton,
      confirmButtonText,
      showCancelButton,
      cancelButtonText,
      width,
    });
  }

  // Form Dialog
  async form({
    title,
    html,
    preConfirm,
    width = '32rem',
  }: {
    title: string;
    html: string;
    preConfirm: () => Promise<any>;
    width?: string;
  }) {
    return Swal.fire({
      title,
      html,
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      preConfirm,
      width,
    });
  }
}

export const sweetAlert = new SweetAlertService(); 