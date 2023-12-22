import React, { Component } from "react";
import { ConnectButton } from "@mysten/dapp-kit";

export default class Head extends Component {
  getNumber = (value) => {
    if (value >= 100000000) {
      return value.toPrecision(2);
    } else if (value >= 1000000) {
      return `${(value / 1000000).toPrecision(3)}M`;
    } else if (value >= 100000) {
      return `${(value / 1000).toPrecision(3)}K`;
    } else {
      return value?.toString();
    }
  };

  render() {
    return (
      <header className="header">
        <div className="scoreboard">
          <div className="title">最高分</div>
          <div>{this.getNumber(this.props.best)}</div>
        </div>
        <div className="scoreboard">
          <div className="title">得分</div>
          <div>{this.getNumber(this.props.score)}</div>
          {this.props.scoreAdded > 0 && (
            <div className="added">+{this.props.scoreAdded}</div>
          )}
        </div>
        <h1
          className={this.props.logoPulse ? "logo-pulse" : undefined}
          aria-label="鸡你太美"
        >
          你太美
        </h1>
        <ConnectButton></ConnectButton>
      </header>
    );
  }
}
