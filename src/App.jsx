import logo from "./logo.svg";
import "./App.scss";
import React, { Component } from "react";

import Head from "./components/Head";
import { useSuiClientQuery, useSuiClientQueries } from "@mysten/dapp-kit";

import Content from "./components/Content";

export default class App extends Component {
  state = {
    best: 0,
    score: 0,
    scoreAdded: 0,
    logoPulse: false,
  };

  changeState = (state) => {
    this.setState(state);
  };

  render() {
    return (
      <div className="App">
        <Head {...this.state}></Head>

        <Content
          changeStateFun={this.changeState}
          best={this.best}
          score={this.score}
          scoreAdded={this.scoreAdded}
          logoPulse={this.logoPulse}
        ></Content>
        <section className="introduction">
          <div className="how-to">
            玩法：
            <strong>
              {"ontouchstart" in window ? "用手指滑动" : "按 方向键 或 WASD 键"}
            </strong>{" "}
            来移动方块，
            <br />
            两个相同的方块可以合成新方块。
            <br />
          </div>
        </section>
      </div>
    );
  }
}
