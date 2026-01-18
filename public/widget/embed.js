(function () {
  "use strict";

  var ECHO_WIDGET_VERSION = "1.0.0";

  function getConfigFromScript(script) {
    return {
      organizationId: script.getAttribute("data-organization-id"),
      projectId: script.getAttribute("data-project-id"),
      theme: script.getAttribute("data-theme") || "auto",
      primaryColor: script.getAttribute("data-primary-color") || "#3b82f6",
      buttonText: script.getAttribute("data-button-text") || "反馈",
      buttonPosition: script.getAttribute("data-button-position") || "bottom-right",
      autoLoad: script.getAttribute("data-auto-load") !== "false",
    };
  }

  function createWidgetIframe(config, baseUrl) {
    var iframe = document.createElement("iframe");
    iframe.id = "echo-widget-iframe";

    var params = new URLSearchParams({
      org: config.organizationId,
      project: config.projectId,
      theme: config.theme,
      primaryColor: config.primaryColor,
      buttonText: encodeURIComponent(config.buttonText),
      position: config.buttonPosition,
    });

    iframe.src =
      baseUrl +
      "/widget/" +
      config.organizationId +
      "/" +
      config.projectId +
      "?" +
      params.toString();

    iframe.style.cssText =
      "border: none; width: 100%; height: 100%; pointer-events: auto;";

    return iframe;
  }

  function createFloatingButton(config, onClick) {
    var button = document.createElement("button");
    button.id = "echo-widget-button";
    button.className = "echo-widget-button";
    button.textContent = decodeURIComponent(config.buttonText);
    button.setAttribute("aria-label", "Open feedback form");

    var positionStyles = {
      "bottom-right": "bottom: 20px; right: 20px;",
      "bottom-left": "bottom: 20px; left: 20px;",
      "top-right": "top: 20px; right: 20px;",
      "top-left": "top: 20px; left: 20px;",
    };

    button.style.cssText =
      (positionStyles[config.buttonPosition] || positionStyles["bottom-right"]) +
      "position: fixed;" +
      "background-color: " +
      config.primaryColor +
      ";" +
      "color: white;" +
      "border: none;" +
      "border-radius: 8px;" +
      "padding: 12px 24px;" +
      "font-size: 14px;" +
      "font-weight: 500;" +
      "cursor: pointer;" +
      "box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);" +
      "transition: transform 0.2s, box-shadow 0.2s;" +
      "z-index: 10000;" +
      "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;";

    button.addEventListener("mouseenter", function () {
      button.style.transform = "translateY(-2px)";
      button.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
    });

    button.addEventListener("mouseleave", function () {
      button.style.transform = "translateY(0)";
      button.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    });

    button.addEventListener("click", onClick);
    document.body.appendChild(button);

    return button;
  }

  function createModal(config, baseUrl) {
    var modal = document.createElement("div");
    modal.id = "echo-widget-modal";
    modal.className = "echo-widget-modal";
    modal.style.display = "none";

    var overlay = document.createElement("div");
    overlay.className = "echo-widget-overlay";
    overlay.style.cssText =
      "position: fixed;" +
      "inset: 0;" +
      "background-color: rgba(0, 0, 0, 0.5);" +
      "z-index: 10001;" +
      "opacity: 0;" +
      "transition: opacity 0.2s;";

    var container = document.createElement("div");
    container.className = "echo-widget-container";
    container.style.cssText =
      "position: fixed;" +
      "top: 50%;" +
      "left: 50%;" +
      "transform: translate(-50%, -50%) scale(0.95);" +
      "width: 90%;" +
      "max-width: 500px;" +
      "height: 600px;" +
      "max-height: 90vh;" +
      "background: white;" +
      "border-radius: 12px;" +
      "box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);" +
      "z-index: 10002;" +
      "opacity: 0;" +
      "transition: opacity 0.2s, transform 0.2s;" +
      "overflow: hidden;";

    var iframe = createWidgetIframe(config, baseUrl);
    container.appendChild(iframe);
    modal.appendChild(overlay);
    modal.appendChild(container);
    document.body.appendChild(modal);

    function closeModal() {
      overlay.style.opacity = "0";
      container.style.opacity = "0";
      container.style.transform = "translate(-50%, -50%) scale(0.95)";
      setTimeout(function () {
        modal.style.display = "none";
      }, 200);
    }

    function openModal() {
      modal.style.display = "block";
      void modal.offsetHeight; // Force reflow
      overlay.style.opacity = "1";
      container.style.opacity = "1";
      container.style.transform = "translate(-50%, -50%) scale(1)";
    }

    overlay.addEventListener("click", closeModal);

    modal.open = openModal;
    modal.close = closeModal;

    return modal;
  }

  function showSuccessMessage() {
    var successMessage = document.createElement("div");
    successMessage.className = "echo-widget-success";
    successMessage.textContent = "Thank you for your feedback!";
    successMessage.style.cssText =
      "position: fixed;" +
      "top: 20px;" +
      "right: 20px;" +
      "background: #10b981;" +
      "color: white;" +
      "padding: 12px 24px;" +
      "border-radius: 8px;" +
      "box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);" +
      "z-index: 10003;" +
      "animation: echoSlideIn 0.3s ease-out;" +
      "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;";
    document.body.appendChild(successMessage);
    setTimeout(function () {
      successMessage.remove();
    }, 3000);
  }

  function injectStyles() {
    var style = document.createElement("style");
    style.textContent =
      "@keyframes echoSlideIn {" +
      "from { transform: translateX(100%); opacity: 0; }" +
      "to { transform: translateX(0); opacity: 1; }" +
      "}";
    document.head.appendChild(style);
  }

  function initWidget(script) {
    var config = getConfigFromScript(script);

    if (!config.organizationId || !config.projectId) {
      console.error("Echo Widget: Missing organizationId or projectId");
      return;
    }

    var baseUrl = script.src.replace(/\/widget\/embed\.js.*$/, "");

    var modal = createModal(config, baseUrl);
    createFloatingButton(config, function () {
      modal.open();
    });

    window.addEventListener("message", function (event) {
      var allowedOrigin = baseUrl || window.location.origin;
      if (event.origin !== allowedOrigin) return;

      if (event.data.type === "echo.widget.close") {
        modal.close();
      }

      if (event.data.type === "echo.widget.submitted") {
        showSuccessMessage();
        modal.close();
      }
    });

    injectStyles();

    console.log("Echo Widget v" + ECHO_WIDGET_VERSION + " loaded");
  }

  function initAllWidgets() {
    var scripts = document.querySelectorAll('script[src*="embed.js"]');
    scripts.forEach(function (script) {
      initWidget(script);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAllWidgets);
  } else {
    initAllWidgets();
  }

  window.EchoWidget = {
    open: function () {
      var modal = document.getElementById("echo-widget-modal");
      if (modal && modal.open) modal.open();
    },
    close: function () {
      var modal = document.getElementById("echo-widget-modal");
      if (modal && modal.close) modal.close();
    },
  };
})();
