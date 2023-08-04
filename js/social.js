var socialNameSpace = {
  //social media
  linkedIn: function () {
    var currentUrl = window.location.href;
    var encodedUrl = encodeURIComponent(currentUrl);
    var url = "https://www.linkedin.com/shareArticle?mini=true&title=Energyprices&url=" + encodedUrl;
    window.open( url,"","menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=450,width=650");
    return false;
  },

  twitter: function () {
    var currentUrl = window.location.href;
    var encodedUrl = encodeURIComponent(currentUrl);
    var url = "https://twitter.com/share?text=Energyprices&url=" + encodedUrl;
    window.open(url,"","menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=400,width=700");
    return false;
  },

  facebook: function () {
    var currentUrl = window.location.href;
    var encodedUrl = encodeURIComponent(currentUrl);
    var url ="https://www.facebook.com/sharer.php?t=Energyprices&u=" + encodedUrl;
    window.open(url,"","menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=500,width=700");
    return false;
  },







  // linkedInModal: function () {
  //   var currentUrl = window.location.href.replace("&modal=0", "&modal="+ REF.modal +"");
  //   currentUrl += "&geo=" + REF.geo;
  //   var encodedUrl = encodeURIComponent(currentUrl);
  //   var url = "https://www.linkedin.com/shareArticle?mini=true&title=Energyprices&url=" + encodedUrl;
  //   // console.log(currentUrl)
  //   window.open( url,"","menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=450,width=650");
  //   return false;
  // },

  // twitterModal: function () {
  //   var currentUrl = window.location.href.replace("&modal=0", "&modal="+ REF.modal +"");
  //   currentUrl += "&geo=" + REF.geo;

  //   var encodedUrl = encodeURIComponent(currentUrl);
  //   var url = "https://twitter.com/share?text=Energyprices&url=" + encodedUrl;
  //   window.open(url,"","menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=400,width=700");
  //   // console.log(currentUrl)
  //   return false;
  // },

  // facebookModal: function () {
  //   var currentUrl = window.location.href.replace("&modal=0", "&modal="+ REF.modal +"");
  //   currentUrl += "&geo=" + REF.geo;
  //   var encodedUrl = encodeURIComponent(currentUrl);
  //   var url ="https://www.facebook.com/sharer.php?t=Energyprices&u=" + encodedUrl;
  //   window.open(url,"","menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=500,width=700");
  //   // console.log(currentUrl)
  //   return false;
  // },
















};
