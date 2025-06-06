document.addEventListener('DOMContentLoaded', function() {
  // 导航栏滚动效果
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('bg-white', 'shadow-md');
      navbar.classList.remove('bg-white/90');
    } else {
      navbar.classList.remove('bg-white', 'shadow-md');
      navbar.classList.add('bg-white/90');
    }
  });

  // 移动端菜单切换
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  menuToggle?.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    if (mobileMenu.classList.contains('hidden')) {
      menuToggle.innerHTML = '<i class="fa fa-bars text-xl"></i>';
    } else {
      menuToggle.innerHTML = '<i class="fa fa-times text-xl"></i>';
    }
  });

  // 平滑滚动
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
        // 关闭移动菜单
        if (!mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.add('hidden');
          menuToggle.innerHTML = '<i class="fa fa-bars text-xl"></i>';
        }
      }
    });
  });

  // 滚动动画
  const animateElements = document.querySelectorAll('.animate-on-scroll');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });

  animateElements.forEach(element => {
    observer.observe(element);
  });

  // 图片懒加载
  const lazyImages = [].slice.call(document.querySelectorAll("img"));
  
  if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.classList.add("fade-in");
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });
    
    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  }

  // 轮播图功能
  const carousel = document.getElementById('carousel');
  const indicators = document.querySelectorAll('.carousel-indicator');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (carousel && prevBtn && nextBtn) {
    let currentSlide = 0;
    const slideCount = carousel.children.length;
    let interval;
    
    // 设置轮播图宽度
    carousel.style.width = `${slideCount * 100}%`;
    Array.from(carousel.children).forEach(slide => {
      slide.style.width = `${100 / slideCount}%`;
    });
    
    // 初始化轮播
    function initCarousel() {
      startAutoSlide();
      setupIndicators();
      setupButtons();
    }
    
    // 自动轮播
    function startAutoSlide() {
      interval = setInterval(() => {
        nextSlide();
      }, 5000);
    }
    
    // 停止自动轮播
    function stopAutoSlide() {
      clearInterval(interval);
    }
    
    // 切换到下一张
    function nextSlide() {
      currentSlide = (currentSlide + 1) % slideCount;
      updateSlide();
    }
    
    // 切换到上一张
    function prevSlide() {
      currentSlide = (currentSlide - 1 + slideCount) % slideCount;
      updateSlide();
    }
    
    // 更新轮播显示
    function updateSlide() {
      carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
      
      // 更新指示器状态
      indicators.forEach((indicator, index) => {
        if (index === currentSlide) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
      });
    }
    
    // 设置指示器点击事件
    function setupIndicators() {
      indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
          currentSlide = index;
          updateSlide();
          resetAutoSlide();
        });
      });
    }
    
    // 设置按钮点击事件
    function setupButtons() {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        prevSlide();
        resetAutoSlide();
      });
      
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        nextSlide();
        resetAutoSlide();
      });
    }
    
    // 重置自动轮播
    function resetAutoSlide() {
      stopAutoSlide();
      startAutoSlide();
    }
    
    // 初始化轮播
    initCarousel();
    
    // 鼠标悬停时停止自动轮播
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
      carouselContainer.addEventListener('mouseenter', stopAutoSlide);
      carouselContainer.addEventListener('mouseleave', startAutoSlide);
    }
  }
});