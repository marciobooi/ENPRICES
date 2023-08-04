const dataNameSpace = {
  version: "1",
  ref: {
    geos: "",
    product: "6000",
    consumer: "HOUSEHOLD",
    consoms: "TOT_KWH",
    unit: "KWH",
    taxs: ["I_TAX", "X_TAX", "X_VAT"],
    nrg_prc: ["NETC", "NRG_SUP", "OTH", "TAX_CAP", "TAX_ENV", "TAX_NUC", "TAX_RNW", "VAT"],
    currency: "EUR",
    language: "EN",
    detail: 0,
    component: 0,
    order: "DESC",
    dataset: "nrg_pc_204",
    time: "2022-S2",
    chartInDetails: 0,
    chartId: "mainChart",
    chartGeo: "",
    percentage: 0,
    share:"false"
  },
  setRefURL() {
    const url = new URL(window.location.href);
    const refParams = Object.entries(this.ref).map(([ref, value]) => `${ref}=${value}`);
    url.search = refParams.join("&");
    this.changeUrl("title", url.toString());
  },
  getRefURL() {
    const getUrlVars = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const vars = {};
      urlParams.forEach((value, key) => {
        vars[key] = value;
      });
      return vars;
    };
  
    const refURL = getUrlVars();
  
    Object.entries(this.ref).forEach(([ref, value]) => {
      if (refURL[ref] !== undefined) {
        this.ref[ref] = refURL[ref];
      }
    });
  
    if (refURL.taxs !== undefined) {
      this.ref.taxs = refURL.taxs.split(",");
    }
  
    if (refURL.nrg_prc !== undefined) {
      this.ref.nrg_prc = refURL.nrg_prc.split(",");
    }
    if (refURL.percentage) {
      this.ref.percentage = parseFloat(refURL.percentage);
    }
  
    if (refURL.geos !== undefined) {
      if (refURL.geos.includes('all')) {
        this.ref.geos = "";
      } else {
        this.ref.geos = refURL.geos.split(",");
      }
    }
  },  
  changeUrl(title, url) {
    if (typeof history.pushState !== "undefined") {
      var obj = {
        Title: title,
        Url: url,
      };
      history.pushState(obj, obj.Title, obj.Url);
    } else {
      alert(languageNameSpace.labels["MSG_BROWSER"]);
    }
  },
};

const REF = dataNameSpace.ref;
