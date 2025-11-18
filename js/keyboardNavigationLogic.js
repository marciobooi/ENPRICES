function trapTab() {
  // Focus on the close button first (better accessibility)
  var closeButton = $("#chartOptionsMenu #closeChartMenuBtn");
  if (closeButton.length > 0) {
    closeButton.focus();
  }

  $("#chartOptionsMenu").keydown(function handleKeydown(event) {
    // Handle ESC key to close menu
    if (event.key === "Escape" || event.key === "Esc") {
      event.preventDefault();
      var container = $("#chartOptionsMenu");
      var menuButton = $("#menu");
      
      container.addClass('toggleMenu');
      menuButton.removeClass('menuOpen');
      menuButton.focus();
      
      // Remove important-styles from any buttons
      $('body').find('.important-styles').removeClass('important-styles');
      $('body').find('.menuOpen').removeClass('menuOpen');
      
      return;
    }
    
    if (event.key.toLowerCase() !== "tab") {
      return;
    }

    // Include close button in focusable elements
    const closeBtn = $("#chartOptionsMenu #closeChartMenuBtn");
    const selects = $("#chartOptionsMenu select");
    const btns = $("#chartOptionsMenu button");
    const focusableElements = closeBtn.add(selects).add(btns);
    var target = $(event.target);
    var firstElement = focusableElements.first();
    var lastElement = focusableElements.last();

    if (event.shiftKey) {
      if (target.is(firstElement)) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (target.is(lastElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  });

  $(document).mouseup(function (e) {
    var container = $("#chartOptionsMenu");
    var menuButton = $("#menu");
  
    // Check if the click is outside the container or on the menu button
    if (!container.is(e.target) && container.has(e.target).length === 0 && !menuButton.is(e.target)) {
      container.addClass('toggleMenu');
    }
  });
  
  // Handle click on the menu button
  $("#menu").click(function() {
    var container = $("#chartOptionsMenu");
    container.toggleClass('toggleMenu');
  });
}
