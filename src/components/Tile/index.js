import React, { Component } from "react";

const getText = (value) => {
  const words = [
    "大家好",
    "我是",
    "练习时长",
    "两年半的", // 2, 4, 8, 16
    "个人练习生",
    "CXK",
    "喜欢",
    "唱", // 32, 64, 128, 256
    "跳",
    "RAP",
    "篮球",
    "MUSIC", // 512, 1024, 2048, 4096
    "鸡",
    "你",
    "太",
    "美", // 8192, 16384, 32768, 65536
    "BABY",
    "OH~", // 131072, undefined
  ];
  return words[Math.min(Math.log2(value), words.length) - 1];
};

export default class Tile extends Component {
  state = {
    pulse: false,
    value: this.props.value,
  };
  _unmounted = false;

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.value !== this.props.value) {
      this.setState(
        {
          pulse: false,
        },
        () =>
          setTimeout(
            () =>
              !this._unmounted &&
              this.setState({
                pulse: true,
                value: this.props.value,
              }),
            50
          )
      );
    }
  }

  componentWillUnmount() {
    this._unmounted = true;
  }

  render() {
    const { i, j, overlaid } = this.props;
    const { value } = this.state;
    let className = `game-tile pos-i-${i} pos-j-${j} tile-${value}`;
    overlaid && (className += " tile-overlaid");
    this.state.pulse && (className += " tile-pulse");
    return (
      <span className={className}>
        <sup className="value">{value}</sup>
        {getText(value)}
      </span>
    );
  }
}
