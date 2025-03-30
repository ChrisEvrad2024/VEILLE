/**
 * Éclosion Printanière - Animations Élégantes
 * Script JavaScript pour activer les animations au bon moment
 */

document.addEventListener('DOMContentLoaded', function() {
  // Activer les animations d'entrée de page
  document.body.classList.add('page-loaded');
  
  // Fonction pour vérifier si un élément est visible dans le viewport
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.85 &&
      rect.bottom >= 0
    );
  }

  // Fonction pour ajouter la classe 'animate' aux éléments visibles
  function handleScrollAnimation() {
    const animatedElements = document.querySelectorAll(
      '.stagger-children, .elegant-form-entry, .backend-table, .stat-counter, .page-entry'
    );
    
    animatedElements.forEach(element => {
      if (isElementInViewport(element)) {
        element.classList.add('animate', 'loaded');
      }
    });
  }

  // Animation fluide des compteurs de statistiques
  function animateCounters() {
    const counters = document.querySelectorAll('.counter-value');
    
    counters.forEach(counter => {
      if (!isElementInViewport(counter) || counter.classList.contains('counted')) return;
      
      counter.classList.add('counted');
      const target = parseInt(counter.getAttribute('data-target'), 10);
      const duration = 1500; // durée de l'animation en ms
      const startTime = performance.now();
      const startValue = 0;
      
      function updateCounter(currentTime) {
        const elapsedTime = currentTime - startTime;
        
        if (elapsedTime < duration) {
          const progress = elapsedTime / duration;
          // Fonction d'accélération cubique pour une animation plus naturelle
          const easedProgress = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          
          const currentValue = Math.round(startValue + (target - startValue) * easedProgress);
          counter.textContent = currentValue.toLocaleString();
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target.toLocaleString();
        }
      }
      
      requestAnimationFrame(updateCounter);
    });
  }

  // Animation des éléments au survol
  function setupHoverAnimations() {
    // Animation pour les cartes du backend
    const cards = document.querySelectorAll('.backend-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.classList.add('card-hovered');
      });
      
      card.addEventListener('mouseleave', function() {
        this.classList.remove('card-hovered');
      });
    });
    
    // Effet d'ondulation au clic (ripple effect)
    const rippleButtons = document.querySelectorAll('.ripple-effect');
    rippleButtons.forEach(button => {
      button.addEventListener('click', function(event) {
        const x = event.clientX - this.getBoundingClientRect().left;
        const y = event.clientY - this.getBoundingClientRect().top;
        
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        this.appendChild(ripple);
        
        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    });
  }

  // Animation pour le menu sidebar
  function setupSidebar() {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.backend-sidebar');
    
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed');
      });
    }
  }

  // Animation pour notifications toast
  function createToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `elegant-notification notification-${type}`;
    toast.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
      </div>
    `;
    
    const toastContainer = document.querySelector('.notification-container') || createToastContainer();
    toastContainer.appendChild(toast);
    
    // L'animation sera appliquée par la classe CSS
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => {
        toast.remove();
      }, 500);
    }, duration);
    
    return toast;
  }
  
  function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
  }
  
  function getNotificationIcon(type) {
    switch(type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  }

  // Animation du header au défilement
  function handleHeaderScroll() {
    const header = document.querySelector('.backend-header');
    if (header) {
      if (window.scrollY > 10) {
        header.classList.add('header-scrolled');
      } else {
        header.classList.remove('header-scrolled');
      }
    }
  }

  // Animation des graphiques
  function animateCharts() {
    const charts = document.querySelectorAll('.chart-container');
    
    charts.forEach(chart => {
      if (isElementInViewport(chart) && !chart.classList.contains('animated')) {
        chart.classList.add('animated');
        // Déclencher l'animation CSS
        const bars = chart.querySelectorAll('.chart-bar');
        bars.forEach((bar, index) => {
          setTimeout(() => {
            bar.classList.add('bar-animated');
          }, index * 100);
        });
      }
    });
  }

  // Animation des formulaires
  function setupFormAnimations() {
    const formInputs = document.querySelectorAll('.elegant-input');
    
    formInputs.forEach(input => {
      const inputContainer = input.closest('.input-container');
      
      if (!inputContainer) return;
      
      input.addEventListener('focus', function() {
        inputContainer.classList.add('input-focused');
      });
      
      input.addEventListener('blur', function() {
        if (!this.value) {
          inputContainer.classList.remove('input-focused');
        }
      });
      
      // Si l'input a déjà une valeur lors du chargement
      if (input.value) {
        inputContainer.classList.add('input-focused');
      }
    });
  }

  // Animation pour les onglets
  function setupTabAnimations() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Supprimer la classe active de tous les boutons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        // Ajouter la classe active au bouton cliqué
        this.classList.add('active');
        
        // Récupérer l'ID du contenu à afficher
        const tabId = this.getAttribute('data-tab');
        
        // Animer la sortie de tous les contenus
        tabContents.forEach(content => {
          content.classList.remove('tab-active');
          content.classList.add('tab-leaving');
        });
        
        // Après l'animation de sortie, afficher le bon contenu
        setTimeout(() => {
          tabContents.forEach(content => {
            content.classList.remove('tab-leaving');
            if (content.id === tabId) {
              content.classList.add('tab-active');
            }
          });
        }, 300);
      });
    });
  }

  // Fonction pour animer de façon séquentielle une liste d'éléments
  function animateSequentially(elements, className, delay = 100, callback = null) {
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add(className);
        if (callback && index === elements.length - 1) {
          callback();
        }
      }, index * delay);
    });
  }

  // Écouter les événements
  window.addEventListener('scroll', function() {
    handleScrollAnimation();
    animateCounters();
    animateCharts();
    handleHeaderScroll();
  });
  
  // Initialiser les animations
  handleScrollAnimation();
  setupHoverAnimations();
  setupSidebar();
  setupFormAnimations();
  setupTabAnimations();
  
  // Exposer certaines fonctions pour une utilisation externe
  window.elegantAnimations = {
    createToast,
    animateSequentially
  };

  // Ajouter une petite animation après le chargement complet
  setTimeout(() => {
    const mainElements = document.querySelectorAll('.main-content > *');
    if (mainElements.length) {
      animateSequentially(mainElements, 'element-visible', 100);
    }
  }, 500);
});