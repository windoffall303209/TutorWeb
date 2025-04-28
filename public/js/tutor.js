function copyLink(link) {
    // Tạo một thẻ input ẩn để chứa URL
    var tempInput = document.createElement('input');
    tempInput.value = link;
    document.body.appendChild(tempInput);
    
    // Chọn và sao chép nội dung trong input
    tempInput.select();
    document.execCommand('copy');
    
    // Xóa input sau khi sao chép
    document.body.removeChild(tempInput);
    
    // Hiển thị thông báo đã sao chép
    var copyMessage = document.getElementById('copy-message');
    copyMessage.style.display = 'block';
    
    // Ẩn thông báo sau 1 giây
    setTimeout(function() {
      copyMessage.style.display = 'none';
    }, 1000);
  }
  