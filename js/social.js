
var socialNameSpace = (function () {
  const text = {
    EN: "This visualisation tool, created by Eurostat, displays electricity and natural gas prices in the EU and other European countries with a great level of detail. Users can interact with the data and customise the display in many different ways.",
    FR: "Cet outil de visualisation, créé par Eurostat, affiche les prix de l'électricité et du gaz naturel dans l'UE et d'autres pays européens avec un grand niveau de détail. Les utilisateurs peuvent interagir avec les données et personnaliser l'affichage de nombreuses manières.",
    DE: "Dieses Visualisierungstool, erstellt von Eurostat, zeigt Strom- und Erdgaspreise in der EU und anderen europäischen Ländern mit einem hohen Detaillierungsgrad an. Benutzer können mit den Daten interagieren und die Anzeige auf vielfältige Weise anpassen."
  };

  const currentUrl = encodeURIComponent(window.location.href);
  const language = (REF.language || 'EN').toUpperCase(); // Default to English and ensure uppercase

  function openWindow(url, height = 450, width = 650) {
    window.open(url, "", `menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=${height},width=${width}`);
  }

  return {
    linkedin: function () {
      const description = encodeURIComponent(text[language]);
      const url = `https://www.linkedin.com/shareArticle?mini=true&title=Energyprices&summary=${description}&url=${currentUrl}`;
      openWindow(url);
      return false;
    },

    twitter: function () {
      const textContent = encodeURIComponent(text[language]);
      const url = `https://twitter.com/share?text=${textContent}&url=${currentUrl}`;
      openWindow(url, 400, 700);
      return false;
    },

    facebook: function () {
      const description = encodeURIComponent(text[language]);
      const url = `https://www.facebook.com/sharer.php?u=${currentUrl}&quote=${description}`;
      openWindow(url, 500, 700);
      return false;
    },

    email: function () {
      const subject = encodeURIComponent("Energy prices");
      const body = encodeURIComponent(`${text[language]} ${window.location.href}`);
      document.location = `mailto:ESTAT-ENERGY@ec.europa.eu?subject=${subject}&body=${body}`;
    },
  };
})();