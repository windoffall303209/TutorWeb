.hover-card {
  transition: all 0.3s ease;
  overflow: hidden;
}

.hover-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}

.hover-card .card-img-top {
  transition: all 0.5s ease;
}

.hover-card:hover .card-img-top {
  transform: scale(1.05);
}

.pagination .page-link {
  color: #4a90e2;
  box-shadow: none;
}

.pagination .page-item.active .page-link {
  background: linear-gradient(135deg, #4a90e2, #5a55ae);
  border-color: #4a90e2;
}
