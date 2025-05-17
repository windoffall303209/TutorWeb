/**
 * JavaScript for Tutor Rating Feature
 */
document.addEventListener("DOMContentLoaded", () => {
  /**
   * Xử lý form đánh giá gia sư
   */
  const ratingForm = document.getElementById('rating-form');
  if (ratingForm) {
    ratingForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Lấy dữ liệu từ form
      const tutorId = this.dataset.tutorId;
      const rating = document.querySelector('input[name="rating"]:checked')?.value;
      const comment = document.getElementById('rating-comment').value;
      
      if (!rating) {
        showNotification('error', 'Vui lòng chọn số sao đánh giá');
        return;
      }
      
      submitRating(tutorId, rating, comment);
    });
  }

  /**
   * Gửi đánh giá gia sư
   * @param {string} tutorId - ID của gia sư
   * @param {number} rating - Số sao đánh giá (1-5)
   * @param {string} comment - Nội dung bình luận
   */
  function submitRating(tutorId, rating, comment) {
    fetch('/ratings/tutor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tutorId: tutorId,
        rating: rating,
        comment: comment
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showNotification('success', data.message);
        
        // Cập nhật giao diện sau khi đánh giá thành công
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showNotification('error', data.message);
      }
    })
    .catch(error => {
      console.error('Lỗi khi gửi đánh giá:', error);
      showNotification('error', 'Đã xảy ra lỗi khi gửi đánh giá.');
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
   * Cập nhật rating cho gia sư sử dụng AJAX
   */
  function loadRatings() {
    const ratingContainer = document.getElementById('tutor-ratings');
    if (!ratingContainer) return;
    
    const tutorId = ratingContainer.dataset.tutorId;
    if (!tutorId) return;
    
    fetch(`/ratings/tutor/${tutorId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          renderRatings(data.data);
        } else {
          console.error('Lỗi khi lấy đánh giá:', data.message);
        }
      })
      .catch(error => {
        console.error('Lỗi khi lấy đánh giá:', error);
      });
  }

  /**
   * Hiển thị danh sách đánh giá
   * @param {Object} data - Dữ liệu đánh giá từ API
   */
  function renderRatings(data) {
    const ratingContainer = document.getElementById('tutor-ratings');
    const ratingItemsContainer = document.getElementById('rating-items');
    if (!ratingContainer || !ratingItemsContainer) return;
    
    // Cập nhật điểm đánh giá trung bình
    const averageRatingElement = document.getElementById('average-rating');
    const totalRatingsElement = document.getElementById('total-ratings');
    
    if (averageRatingElement) {
      averageRatingElement.textContent = data.averageRating;
    }
    
    if (totalRatingsElement) {
      totalRatingsElement.textContent = data.totalRatings;
    }
    
    // Cập nhật phân phối đánh giá
    for (let i = 1; i <= 5; i++) {
      const progressElement = document.getElementById(`rating-progress-${i}`);
      const percentElement = document.getElementById(`rating-percent-${i}`);
      
      if (progressElement && percentElement) {
        const count = data.ratingDistribution[i] || 0;
        const percent = data.totalRatings > 0 ? Math.round((count / data.totalRatings) * 100) : 0;
        
        progressElement.style.width = `${percent}%`;
        percentElement.textContent = `${percent}%`;
      }
    }
    
    // Cập nhật form đánh giá nếu người dùng đã đánh giá
    if (data.userRating) {
      const ratingInput = document.querySelector(`input[name="rating"][value="${data.userRating.rating}"]`);
      const commentInput = document.getElementById('rating-comment');
      
      if (ratingInput) {
        ratingInput.checked = true;
      }
      
      if (commentInput && data.userRating.comment) {
        commentInput.value = data.userRating.comment;
      }
      
      // Cập nhật nội dung button
      const submitButton = document.querySelector('#rating-form button[type="submit"]');
      if (submitButton) {
        submitButton.textContent = 'Cập nhật đánh giá';
      }
    }
    
    // Hiển thị danh sách đánh giá
    ratingItemsContainer.innerHTML = '';
    
    if (data.ratings.length === 0) {
      ratingItemsContainer.innerHTML = `
        <div class="no-ratings-message">
          <div class="no-ratings-icon"><i class="far fa-comment-dots"></i></div>
          <h5>Chưa có đánh giá nào</h5>
          <p>Hãy là người đầu tiên đánh giá gia sư này!</p>
        </div>
      `;
      return;
    }
    
    data.ratings.forEach(rating => {
      // Tạo HTML cho hiển thị sao
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        if (i <= rating.rating) {
          starsHtml += '<i class="fas fa-star"></i>';
        } else {
          starsHtml += '<i class="far fa-star"></i>';
        }
      }
      
      // Format ngày tháng
      const ratingDate = new Date(rating.created_at);
      const formattedDate = ratingDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Kiểm tra nếu là đánh giá của người dùng hiện tại
      const isCurrentUser = data.userRating && data.userRating.id === rating.id;
      
      const ratingItemHtml = `
        <div class="rating-item ${isCurrentUser ? 'user-rating-highlight' : ''}">
          <div class="rating-item-header">
            <div class="rating-user-avatar">
              ${rating.display_name ? rating.display_name.charAt(0).toUpperCase() : rating.username.charAt(0).toUpperCase()}
            </div>
            <div class="rating-user-info">
              <div class="rating-user-name">
                ${rating.display_name || rating.username}
                ${isCurrentUser ? '<span class="badge bg-info ms-2">Đánh giá của bạn</span>' : ''}
              </div>
              <div class="rating-date">${formattedDate}</div>
            </div>
            <div class="rating-stars-display">
              ${starsHtml}
            </div>
          </div>
          <div class="rating-content">
            ${rating.comment || '<em>Không có bình luận</em>'}
          </div>
          ${isCurrentUser ? `
            <div class="rating-actions">
              <button class="btn btn-sm btn-outline-primary edit-rating-btn" data-rating-id="${rating.id}">
                <i class="fas fa-edit"></i> Sửa
              </button>
            </div>
          ` : ''}
        </div>
      `;
      
      ratingItemsContainer.innerHTML += ratingItemHtml;
    });
    
    // Thêm sự kiện cho nút sửa đánh giá
    const editButtons = document.querySelectorAll('.edit-rating-btn');
    if (editButtons.length > 0) {
      editButtons.forEach(button => {
        button.addEventListener('click', function() {
          // Cuộn đến form đánh giá
          const ratingForm = document.getElementById('rating-form');
          if (ratingForm) {
            ratingForm.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });
    }
  }

  // Tự động cập nhật đánh giá khi trang được tải
  if (document.getElementById('tutor-ratings')) {
    loadRatings();
  }
}); 