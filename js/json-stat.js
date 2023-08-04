/*

JSON-stat Javascript Toolkit v. 0.10.2 (JSON-stat v. 2.0 ready)
http://json-stat.com
https://github.com/badosa/JSON-stat

Copyright 2016 Xavier Badosa (http://xavierbadosa.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied. See the License for the specific language governing
permissions and limitations under the License.

*/

function JSONstat(t, e, n) {
  return window === this ? new JSONstat.jsonstat(t, e, n) : void 0;
}
var JSONstat = JSONstat || {};
(JSONstat.version = "0.10.2"),
  (function () {
    "use strict";
    function t(t) {
      return "[object Array]" === Object.prototype.toString.call(t);
    }
    function e(e, n, i) {
      var s,
        r,
        l,
        a,
        o = function (t, e, n) {
          var i,
            s,
            r = e !== !1;
          if (
            ((n = e ? n : !0),
            window.XDomainRequest && /^(http(s)?:)?\/\//.test(t))
          ) {
            if (!r) return;
            (s = new XDomainRequest()),
              (s.onload = function () {
                (i = JSON.parse(s.responseText)),
                  n ? e.call(JSONstat(i)) : e.call(i);
              }),
              s.open("GET", t),
              s.send();
          } else if (
            ((s = new XMLHttpRequest()),
            (s.onreadystatechange = function () {
              if (4 === s.readyState) {
                var t = s.status;
                (i =
                  t && s.responseText && ((t >= 200 && 300 > t) || 304 === t)
                    ? JSON.parse(s.responseText)
                    : null),
                  r && (n ? e.call(JSONstat(i)) : e.call(i));
              }
            }),
            s.open("GET", t, r),
            s.send(null),
            !r)
          )
            return i;
        },
        u = function (e, n) {
          var i,
            s = [];
          if (("string" == typeof e && (e = [e]), t(e))) {
            if (e.length === n) return e;
            if (1 === e.length) {
              for (i = 0; n > i; i++) s.push(e[0]);
              return s;
            }
          }
          for (i = 0; n > i; i++) {
            var r = void 0 === e[i] ? null : e[i];
            s.push(r);
          }
          return s;
        };
      if (((this.length = 0), (this.id = []), null !== e && void 0 !== e))
        switch (((this["class"] = e["class"] || "bundle"), this["class"])) {
          case "bundle":
            var h = [],
              f = 0;
            if (
              ((this.error = null),
              (this.length = 0),
              "string" == typeof e &&
                e.length > 0 &&
                (e = o(
                  e,
                  "function" == typeof n ? n : !1,
                  void 0 === i ? !0 : i
                )),
              null === e || "object" != typeof e)
            )
              return (
                (this["class"] = null),
                void (
                  void 0 === e &&
                  (delete this.id,
                  delete this["class"],
                  delete this.error,
                  delete this.length)
                )
              );
            if (e.hasOwnProperty("error")) return void (this.error = e.error);
            if ("dataset" === e["class"] || "collection" === e["class"])
              return JSONstat(e);
            for (r in e) f++, h.push(r);
            (this.__tree__ = e), (this.length = f), (this.id = h);
            break;
          case "dataset":
            e.hasOwnProperty("__tree__")
              ? (this.__tree__ = s = e.__tree__)
              : (this.__tree__ = s = e),
              (this.label = s.label || null),
              (this.note = s.note || null),
              (this.link = s.link || null),
              (this.href = s.href || null),
              (this.updated = s.updated || null),
              (this.source = s.source || null),
              (this.extension = s.extension || null);
            var c,
              d = 0,
              p = s.size || (s.dimension && s.dimension.size);
            if (((this.size = p), s.hasOwnProperty("value") && t(s.value)))
              d = s.value.length;
            else {
              var v = 1;
              for (c = p.length; c--; ) v *= p[c];
              d = v;
            }
            if (
              ((this.value = u(s.value, d)),
              (this.status = s.hasOwnProperty("status")
                ? u(s.status, d)
                : null),
              s.hasOwnProperty("dimension"))
            ) {
              var g = s.dimension,
                y = s.role || (!s.version && g.role) || null,
                _ = s.id || g.id,
                b = p.length,
                m = function (t) {
                  y.hasOwnProperty(t) || (y[t] = null);
                };
              if (!t(_) || !t(p) || _.length != b) return;
              if (
                ((this.length = b),
                (this.id = _),
                y && (m("time"), m("geo"), m("metric"), m("classification")),
                y && null === y.classification)
              ) {
                var w = [],
                  O = ["time", "geo", "metric"],
                  x = function (t, e) {
                    for (var n = e.length; n--; ) if (t === e[n]) return !0;
                    return !1;
                  };
                for (c = 0; 3 > c; c++) {
                  var S = y[O[c]];
                  null !== S && (w = w.concat(S));
                }
                for (y.classification = [], c = 0; b > c; c++)
                  x(_[c], w) || y.classification.push(_[c]);
                0 === y.classification.length && (y.classification = null);
              }
              (this.role = y), (this.n = d);
              for (var k = 0, J = this.length; J > k; k++)
                if (g[_[k]].category.hasOwnProperty("index")) {
                  if (t(g[_[k]].category.index)) {
                    var N = {},
                      D = g[_[k]].category.index;
                    for (l = D.length, a = 0; l > a; a++) N[D[a]] = a;
                    g[_[k]].category.index = N;
                  }
                } else {
                  var P = 0;
                  g[_[k]].category.index = {};
                  for (r in g[_[k]].category.label)
                    g[_[k]].category.index[r] = P++;
                }
            } else this.length = 0;
            break;
          case "dimension":
            s = e.__tree__;
            var j = [],
              z = s.category;
            if (!e.hasOwnProperty("__tree__") || !s.hasOwnProperty("category"))
              return;
            if (!z.hasOwnProperty("label")) {
              z.label = {};
              for (r in z.index) z.label[r] = r;
            }
            for (r in z.index) j[z.index[r]] = r;
            (this.__tree__ = s),
              (this.label = s.label || null),
              (this.note = s.note || null),
              (this.link = s.link || null),
              (this.href = s.href || null),
              (this.id = j),
              (this.length = j.length),
              (this.role = e.role),
              (this.hierarchy = z.hasOwnProperty("child")),
              (this.extension = s.extension || null);
            break;
          case "category":
            var T = e.child;
            (this.id = T),
              (this.length = null === T ? 0 : T.length),
              (this.index = e.index),
              (this.label = e.label),
              (this.note = e.note || null),
              (this.unit = e.unit),
              (this.coordinates = e.coord);
            break;
          case "collection":
            if (
              ((this.length = 0),
              (this.label = e.label || null),
              (this.note = e.note || null),
              (this.link = e.link || null),
              (this.href = e.href || null),
              (this.updated = e.updated || null),
              (this.source = e.source || null),
              (this.extension = e.extension || null),
              null !== this.link && e.link.item)
            ) {
              var V = e.link.item;
              if (((this.length = t(V) ? V.length : 0), this.length))
                for (a = 0; a < this.length; a++) this.id[a] = V[a].href;
            }
        }
    }
    (e.prototype.Item = function (t) {
      if (null === this || "collection" !== this["class"] || !this.length)
        return null;
      if ("number" == typeof t)
        return t > this.length || 0 > t ? null : this.link.item[t];
      var e,
        n = [];
      if ("object" == typeof t) {
        if (!t["class"] && !t.follow) return null;
        t["class"]
          ? (e =
              "dataset" === t["class"] && "boolean" == typeof t.embedded
                ? t.embedded === !0
                  ? function (t, e, i) {
                      var s = t.link.item[e];
                      i["class"] === s["class"] &&
                        s.id &&
                        s.size &&
                        s.dimension &&
                        n.push(s);
                    }
                  : function (t, e, i) {
                      var s = t.link.item[e];
                      i["class"] !== s["class"] ||
                        (s.id && s.size && s.dimension) ||
                        n.push(s);
                    }
                : function (t, e, i) {
                    i["class"] === t.link.item[e]["class"] &&
                      n.push(t.link.item[e]);
                  })
          : t.follow &&
            (e = function (t, e) {
              n.push(JSONstat(t.id[e]));
            });
      } else
        e = function (t, e) {
          n.push(t.link.item[e]);
        };
      for (var i = 0; i < this.length; i++) e(this, i, t);
      return n;
    }),
      (e.prototype.Dataset = function (t) {
        if (null === this) return null;
        if ("dataset" === this["class"]) return void 0 !== t ? this : [this];
        var n,
          i = [],
          s = 0;
        if ("collection" === this["class"]) {
          var r = this.Item({ class: "dataset", embedded: !0 });
          if (void 0 === t) {
            for (n = r.length; n > s; s++) i.push(JSONstat(r[s]));
            return i;
          }
          if ("number" == typeof t && t >= 0 && t < r.length)
            return JSONstat(r[t]);
          if ("string" == typeof t)
            for (n = r.length; n > s; s++)
              if (r[s].href === t) return JSONstat(r[s]);
          return null;
        }
        if ("bundle" !== this["class"]) return null;
        if (void 0 === t) {
          for (n = this.id.length; n > s; s++) i.push(this.Dataset(this.id[s]));
          return i;
        }
        if ("number" == typeof t) {
          var l = this.id[t];
          return void 0 !== l ? this.Dataset(l) : null;
        }
        var a = this.__tree__[t];
        return void 0 === a ? null : new e({ class: "dataset", __tree__: a });
      }),
      (e.prototype.Dimension = function (t) {
        var n,
          i = [],
          s = this.id.length,
          r = function (t, e) {
            if (null !== t)
              for (var n in t)
                for (var i = null !== t[n] ? t[n].length : 0; i--; )
                  if (t[n][i] === e) return n;
            return null;
          };
        if (null === this || "dataset" !== this["class"]) return null;
        if (void 0 === t) {
          for (n = 0; s > n; n++) i.push(this.Dimension(this.id[n]));
          return i;
        }
        if ("number" == typeof t) {
          var l = this.id[t];
          return void 0 !== l ? this.Dimension(l) : null;
        }
        var a = this.role;
        if ("object" == typeof t) {
          if (t.hasOwnProperty("role")) {
            for (n = 0; s > n; n++) {
              var o = this.id[n];
              r(a, o) === t.role && i.push(this.Dimension(o));
            }
            return void 0 === i[0] ? null : i;
          }
          return null;
        }
        var u = this.__tree__.dimension;
        if (void 0 === u) return null;
        var h = u[t];
        return void 0 === h
          ? null
          : new e({ class: "dimension", __tree__: h, role: r(a, t) });
      }),
      (e.prototype.Category = function (t) {
        if (null === this || "dimension" !== this["class"]) return null;
        if (void 0 === t) {
          for (var n = [], i = 0, s = this.id.length; s > i; i++)
            n.push(this.Category(this.id[i]));
          return n;
        }
        if ("number" == typeof t) {
          var r = this.id[t];
          return void 0 !== r ? this.Category(r) : null;
        }
        var l = this.__tree__.category;
        if (void 0 === l) return null;
        var a = l.index[t];
        if (void 0 === a) return null;
        var o = (l.unit && l.unit[t]) || null,
          u = (l.coordinates && l.coordinates[t]) || null,
          h = (l.child && l.child[t]) || null,
          f = (l.note && l.note[t]) || null;
        return new e({
          class: "category",
          index: a,
          label: l.label[t],
          note: f,
          child: h,
          unit: o,
          coord: u,
        });
      }),
      (e.prototype.Data = function (e, n) {
        var i,
          s,
          r = [],
          l = function (t) {
            for (var e in t) if (t.hasOwnProperty(e)) return e;
          },
          a = function (t, e) {
            for (
              var n = [],
                i = t.dimension,
                s = t.id || i.id,
                r = t.size || (i && i.size),
                a = 0,
                o = s.length;
              o > a;
              a++
            ) {
              var u = s[a],
                h = e[u];
              n.push(
                "string" == typeof h
                  ? h
                  : 1 === r[a]
                  ? l(i[u].category.index)
                  : null
              );
            }
            return n;
          };
        if (null === this || "dataset" !== this["class"]) return null;
        if (void 0 === e) {
          for (s = this.value.length, i = 0; s > i; i++) r.push(this.Data(i));
          return r;
        }
        if (("boolean" != typeof n && (n = !0), "number" == typeof e)) {
          var o = this.value[e];
          return void 0 === o
            ? null
            : n
            ? { value: o, status: this.status ? this.status[e] : null }
            : o;
        }
        var u = this.__tree__,
          h = u.size || (u.dimension && u.dimension.size),
          f = h.length;
        if (t(e)) {
          if (this.length !== e.length) return null;
          var c = 1,
            d = 0,
            p = [],
            v = [];
          for (i = 0; f > i; i++)
            if (void 0 !== e[i]) {
              if ("number" != typeof e[i] || e[i] >= h[i]) return null;
              (c *= i > 0 ? h[f - i] : 1), (d += c * e[f - i - 1]);
            } else p.push(i), v.push(h[i]);
          if (p.length > 1) return null;
          if (1 === p.length) {
            for (var g = 0, y = v[0]; y > g; g++) {
              var _ = [];
              for (i = 0; f > i; i++) i !== p[0] ? _.push(e[i]) : _.push(g);
              r.push(this.Data(_, n));
            }
            return r;
          }
          return n
            ? {
                value: this.value[d],
                status: this.status ? this.status[d] : null,
              }
            : this.value[d];
        }
        var b = a(u, e),
          m = [],
          w = u.dimension,
          O = u.id || w.id;
        for (i = 0, s = b.length; s > i; i++)
          m.push(w[O[i]].category.index[b[i]]);
        return this.Data(m, n);
      }),
      (e.prototype.toTable = function (t, e) {
        if (null === this || "dataset" !== this["class"]) return null;
        1 == arguments.length &&
          "function" == typeof t &&
          ((e = t), (t = null));
        var n,
          i,
          s,
          r,
          l,
          a = this.__tree__;
        if (
          ((t = t || {
            field: "label",
            content: "label",
            vlabel: "Value",
            slabel: "Status",
            type: "array",
            status: !1,
          }),
          "function" == typeof e)
        ) {
          n = this.toTable(t);
          var o = [],
            u = "array" !== t.type ? 0 : 1,
            h = "object" !== t.type ? n.slice(u) : n.rows.slice(0);
          for (l = h.length, i = 0; l > i; i++) {
            var f = e.call(this, h[i], i);
            void 0 !== f && o.push(f);
          }
          return "object" === t.type
            ? { cols: n.cols, rows: o }
            : ("array" === t.type && o.unshift(n[0]), o);
        }
        if ("arrobj" === t.type) {
          n = this.toTable({
            field: "id",
            content: t.content,
            status: t.status,
          });
          var c = [],
            d = n.shift();
          for (l = n.length, i = 0; l > i; i++) {
            var p = {};
            for (s = n[i].length; s--; ) p[d[s]] = n[i][s];
            c.push(p);
          }
          return c;
        }
        var v,
          g,
          y,
          _,
          b = "id" === t.field;
        if ("object" === t.type) {
          var m =
            "number" == typeof this.value[0] || null === this.value[0]
              ? "number"
              : "string";
          (v = function (t, e) {
            var n = (b && t) || e || t;
            T.push({ id: t, label: n, type: "string" });
          }),
            (g = function (t, e, n) {
              var i = (b && "value") || t || "Value",
                s = (b && "status") || e || "Status";
              n && T.push({ id: "status", label: s, type: "string" }),
                T.push({ id: "value", label: i, type: m });
            }),
            (y = function (t) {
              B.push({ v: t });
            }),
            (_ = function (t) {
              B.push({ v: t }), V.push({ c: B });
            });
        } else
          (v = function (t, e) {
            var n = (b && t) || e || t;
            T.push(n);
          }),
            (g = function (t, e, n) {
              var i = (b && "value") || t || "Value",
                s = (b && "status") || e || "Status";
              n && T.push(s), T.push(i), z.push(T);
            }),
            (y = function (t) {
              B.push(t);
            }),
            (_ = function (t) {
              B.push(t), z.push(B);
            });
        var w = a.dimension,
          O = a.id || w.id,
          x = a.size || w.size,
          S = O.length;
        if (S != x.length) return !1;
        var k = [],
          J = 1,
          N = 1,
          D = [],
          P = [],
          j = [],
          z = [],
          T = [],
          V = [];
        for (i = 0; S > i; i++) {
          var q = O[i],
            C = w[q].label;
          v(q, C), (J *= x[i]), (N *= x[i]);
          var R = [];
          for (s = 0; s < x[i]; s++)
            for (var X in w[O[i]].category.index)
              if (w[O[i]].category.index[X] === s) {
                var E =
                  "id" !== t.content && w[O[i]].category.label
                    ? w[O[i]].category.label[X]
                    : X;
                R.push(E);
              }
          k.push(R), D.push(N);
        }
        for (g(t.vlabel, t.slabel, t.status), l = k.length, i = 0; l > i; i++) {
          for (var G = [], I = 0, A = k[i].length; A > I; I++)
            for (var H = 0; H < J / D[i]; H++) G.push(k[i][I]);
          P.push(G);
        }
        for (l = P.length, i = 0; l > i; i++) {
          var L = [],
            M = 0;
          for (r = 0; J > r; r++)
            L.push(P[i][M]), M++, M === P[i].length && (M = 0);
          j.push(L);
        }
        for (r = 0; J > r; r++) {
          var B = [];
          l = P.length;
          for (var F = 0; l > F; F++) y(j[F][r]);
          t.status && y(this.status ? this.status[r] : null), _(this.value[r]);
        }
        return "object" === t.type ? { cols: T, rows: V } : z;
      }),
      (e.prototype.node = function () {
        return this.__tree__;
      }),
      (e.prototype.toString = function () {
        return this["class"];
      }),
      (e.prototype.toValue = function () {
        return this.length;
      }),
      (JSONstat.jsonstat = e);
  })();
