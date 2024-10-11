import { Buffer } from "buffer";

class HttpClient {
  constructor(url, password) {
    this.url = url;
    this.password = password;
    this.headers = {};

    this._setHeaders();
  }

  _setHeaders() {
    this.headers = {
      Authorization:
        "Basic " + Buffer.from(":" + this.password).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    };
  }

  async _call(path, method, data, type = "json") {
    try {
      const options = {
        method,
        headers: this.headers,
      };

      if (data) {
        options.body = Object.keys(data)
          .map((key) => {
            return (
              encodeURIComponent(key) + "=" + encodeURIComponent(data[key])
            );
          })
          .join("&");
      }

      const response = await fetch(`${this.url}${path}`, options);

      if (!response.ok) {
        console.log('NOT OK!!');
        console.log(response);
        throw new Error(response.statusText);
      }

      if (type === "json") {
        return response.json();
      } else {
        return response.text();
      }
    } catch (e) {
      throw e;
    }
  }

  get(path) {
    return this._call(path, "GET");
  }

  getText(path) {
    return this._call(path, "GET", undefined, "text");
  }

  post(path, data) {
    return this._call(path, "POST", data);
  }
}

export default HttpClient;
