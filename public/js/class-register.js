/**
 * JavaScript for Class Registration Feature
 */
document.addEventListener("DOMContentLoaded", () => {
  /**
   * Đăng ký nhận lớp
   */
  const registerButtons = document.querySelectorAll('.register-class-btn');
  if (registerButtons.length > 0) {
    registerButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const classId = this.dataset.classId;
        
        // Hiển thị confirm dialog trước khi đăng ký
        if (confirm('Bạn có chắc chắn muốn đăng ký nhận lớp này không?')) {
          registerForClass(classId);
        }
      });
    });
  }

  /**
   * Xử lý đăng ký nhận lớp
   * @param {string} classId - ID của lớp học
   */
  function registerForClass(classId) {
    // Đảm bảo classId không rỗng
    if (!classId) {
      showNotification('error', 'ID lớp học không hợp lệ');
      return;
    }
    
    // Log classId for debugging
    console.log("Sending class registration with classId:", classId, "Type:", typeof classId);
    
    fetch('/classes/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ classId: classId }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showNotification('success', data.message);
        
        // Cập nhật giao diện sau khi đăng ký thành công
        const registerButton = document.querySelector(`.register-class-btn[data-class-id="${classId}"]`);
        if (registerButton) {
          registerButton.disabled = true;
          registerButton.classList.remove('btn-primary');
          registerButton.classList.add('btn-secondary');
          registerButton.innerHTML = '<i class="fas fa-check-circle"></i> Đã đăng ký';
        }
      } else {
        showNotification('error', data.message);
      }
    })
    .catch(error => {
      console.error('Lỗi khi đăng ký nhận lớp:', error);
      showNotification('error', 'Đã xảy ra lỗi khi đăng ký nhận lớp.');
    });
  }

  /**
   * Xử lý phản hồi đăng ký (chấp nhận hoặc từ chối)
   */
  const responseButtons = document.querySelectorAll('.respond-registration-btn');
  if (responseButtons.length > 0) {
    responseButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        const registrationId = this.dataset.registrationId;
        const action = this.dataset.action; // 'accept' hoặc 'reject'
        const status = action === 'accept' ? 'accepted' : 'rejected';
        
        // Lấy ghi chú từ form modal (nếu có)
        const notesElement = document.getElementById('registration-notes');
        const notes = notesElement ? notesElement.value : '';
        
        respondToRegistration(registrationId, status, notes);
      });
    });
  }

  /**
   * Xử lý phản hồi đăng ký
   * @param {string} registrationId - ID của đăng ký
   * @param {string} status - Trạng thái mới ('accepted' hoặc 'rejected')
   * @param {string} notes - Ghi chú phản hồi
   */
  function respondToRegistration(registrationId, status, notes) {
    fetch('/classes/registrations/respond', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        registrationId: registrationId,
        status: status,
        notes: notes
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showNotification('success', data.message);
        
        // Đóng modal nếu đang mở
        const modal = document.getElementById('responseModal');
        if (modal) {
          const modalInstance = bootstrap.Modal.getInstance(modal);
          if (modalInstance) {
            modalInstance.hide();
          }
        }
        
        // Cập nhật giao diện
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showNotification('error', data.message);
      }
    })
    .catch(error => {
      console.error('Lỗi khi xử lý đăng ký:', error);
      showNotification('error', 'Đã xảy ra lỗi khi xử lý đăng ký.');
    });
  }

  /**
   * Hiển thị thông báo
   * @param {string} type - Loại thông báo ('success', 'error', 'info', 'warning')
   * @param {string} message - Nội dung thông báo
   */
  function showNotification(type, message) {
    // Kiểm tra nếu có thư viện Toastr
    if (typeof toastr !== 'undefined') {
      toastr[type](message);
      return;
    }
    
    // Fallback nếu không có Toastr
    alert(message);
  }

  /**
   * Hiển thị modal phản hồi khi nhấn nút chấp nhận hoặc từ chối
   */
  const responseModalTriggers = document.querySelectorAll('.open-response-modal');
  if (responseModalTriggers.length > 0) {
    responseModalTriggers.forEach(trigger => {
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        
        const registrationId = this.dataset.registrationId;
        const action = this.dataset.action;
        const tutorName = this.dataset.tutorName;
        
        // Cập nhật modal
        const modalTitle = document.getElementById('responseModalLabel');
        const actionButton = document.getElementById('confirm-response-btn');
        
        if (modalTitle && actionButton) {
          if (action === 'accept') {
            modalTitle.textContent = `Chấp nhận gia sư ${tutorName}`;
            actionButton.textContent = 'Chấp nhận';
            actionButton.className = 'btn btn-success respond-registration-btn';
          } else {
            modalTitle.textContent = `Từ chối gia sư ${tutorName}`;
            actionButton.textContent = 'Từ chối';
            actionButton.className = 'btn btn-danger respond-registration-btn';
          }
          
          actionButton.dataset.registrationId = registrationId;
          actionButton.dataset.action = action;
        }
        
        // Hiển thị modal
        const responseModal = new bootstrap.Modal(document.getElementById('responseModal'));
        responseModal.show();
      });
    });
  }
}); 