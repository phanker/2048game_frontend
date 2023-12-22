import React, { useState, useRef, useEffect, useMemo } from "react";
import Game2048, { Direction, Game2048Tile } from "../../components/Game2048";
import Tile from "../../components/Tile";
import SoundManager from "../../components/SoundManager";
import StateManager from "../../components/StateManager";
import VibratorManager from "../../components/VibratorManager";
import {
  useCurrentWallet,
  useCurrentAccount,
  useSuiClientInfiniteQuery,
  useSignAndExecuteTransactionBlock,
  useSuiClientQuery,
  useSuiClientQueries,
  useSignTransactionBlock,
  useSuiClient,
} from "@mysten/dapp-kit";
import Hammer from "hammerjs";
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import {
  SUI_CLOCK_OBJECT_ID,
  SUI_DECIMALS,
  SUI_TYPE_ARG,
} from "@mysten/sui.js/utils";

import {
  TransactionBlock,
  TransactionObjectArgument,
} from "@mysten/sui.js/transactions";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function coverToState(detailInfos) {
  let nums = new Array(16);
  detailInfos.forEach((value, index) => {
    console.log({ value });
    const i = value.fields.value.fields.i;
    console.log({ i });
    const j = value.fields.value.fields.j;
    console.log({ j });
    const v = i * 4 + j * 1;
    console.log({ v });
    nums[v] = value.fields.value.fields.value * 1;
  });
  return nums;
}

const PACKAGE_ID =
  "0x64eda0258562329e2eb996d93b16758f200ea406c2bede0949806c5af05c8ea9";
const MODULE_NAME = "game_2048";
const weather_object_id =
  "0xa705f6a72f08298c817f16b8e23564a68fc304538c42c9b76af7b85167c1e79c";
// "0x1aedcca0b67b891c64ca113fce87f89835236b4c77294ba7e2db534ad49a58dc"; //mainnet
const SEND_FUNCTION_NAME = "new_game";
const MOVE_FUNCTION_NAME = "move_tile";

export default function Content(props) {
  const changeStateFun = props.changeStateFun;
  const { isConnected, connectionStatus } = useCurrentWallet();
  const { mutate: signAndExecuteTransactionBlock } =
    useSignAndExecuteTransactionBlock();
  const { mutate: signTransactionBlock } = useSignTransactionBlock();
  const currentAccount = useCurrentAccount();

  const client = useSuiClient();

  const [tiles, setTiles] = useState([]);

  const [message, setMessage] = useState("");
  const [messageVisible, setMessageVisible] = useState(false);

  const gameRef = useRef(null);
  const containerRef = useRef(null);

  const vibratorManager = new VibratorManager();
  const stateManager = new StateManager();

  const [gameId, setGameId] = useState();
  // stateManager.getGameId() ? stateManager.getGameId() : ""

  const {
    data: objectData,
    isPending,
    error,
    refetch,
  } = useSuiClientQuery(
    "getObject",
    {
      id: gameId,
      options: {
        showContent: true,
        showOwner: true,
      },
    },
    {
      enabled: isConnected && gameId != "",
    }
  );

  const {
    data: ownObjectsData,
    isPending: isObjsPending,
    error: objsError,
    refetch: objectRefetch,
  } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: currentAccount?.address,
      options: {
        showContent: true,
        showOwner: true,
      },
      filter: {
        MoveModule: {
          module: MODULE_NAME,
          /** the Move package ID */
          package: PACKAGE_ID,
        },
      },
    },
    {
      enabled: isConnected,
      refetchInterval: 1000,
    }
  );

  const allGamesData = useMemo(() => {
    // 提取并转换数据
    const extractedData = ownObjectsData?.data.map((item) => {
      const { objectId: id, content } = item.data;
      const { isgameOver, score, tiles, won } = content.fields;

      return {
        id,
        isgameOver,
        score: parseInt(score, 10), // 将字符串类型的score转换为数字
        tiles, // 假设您想保留tiles的完整结构
        won,
      };
    });
    // 根据score排序
    return extractedData?.sort((a, b) => b.score - a.score);
  }, [ownObjectsData]);

  const newestGameId = useMemo(() => {
    if (ownObjectsData?.data && ownObjectsData?.data.length > 0) {
      return ownObjectsData.data[ownObjectsData.data.length - 1].data.objectId;
    }
    return "";
  }, [ownObjectsData]);

  const tilesData = useMemo(() => {
    const detailInfos = objectData?.data.content.fields.tiles.fields.contents;
    const isgameOver = objectData?.data.content.fields.isgameOver;
    const score = objectData?.data.content.fields.score;
    const won = objectData?.data.content.fields.won;
    console.log(objectData?.data.content);

    let _tiles = new Array();
    detailInfos?.forEach((innerValue) => {
      const tile = innerValue.fields.value.fields;
      _tiles.push(tile);
    });
    return {
      _tiles,
      isgameOver,
      score,
      won,
    };
  }, [objectData]);

  const soundManager = new SoundManager({
    onPlay: () => {
      changeStateFun({
        logoPulse: true,
      });
    },
    onEnded: () => {
      changeStateFun({
        logoPulse: false,
      });
    },
  });

  useEffect(() => {
    setTiles(tilesData._tiles);
    if (tilesData._tiles && tilesData._tiles.length > 1) {
      changeStateFun({
        logoPulse: true,
      });
    } else {
      changeStateFun({
        logoPulse: false,
      });
    }

    if (!isConnected) {
      changeStateFun({
        logoPulse: false,
      });
      setGameId();
    }

    // if (newestGameId) {

    // }
    if (!gameId) {
      setGameId(newestGameId);
    }

    changeStateFun({
      score: tilesData.score,
      best: allGamesData && allGamesData.length > 0 ? allGamesData[0].score : 0,
    });

    // if (gameId == null) {
    //   if (allGamesData && allGamesData.length > 0) {
    //     setGameId(allGamesData[0].id);
    //   }
    // }

    window.addEventListener("keydown", _moveK);

    console.log(gameRef.current);
    if (!gameRef.current) {
      initGame();
    }
    const hammer = new Hammer.Manager(containerRef.current, {
      recognizers: [[Hammer.Pan]],
    });
    hammer.on("panstart", (event) => _moveG(event.direction));
    // _tryResumeGame();
    // 清理函数
    return () => {
      window.removeEventListener("keydown", _moveK);
      // 任何其他需要的清理操作
    };
  }, [tilesData, gameId, allGamesData, isConnected]);

  const _moveK = (event) => {
    if (!isConnected) {
      toast("请先连接钱包，再开始游戏。");
      return;
    }
    if (
      gameRef.current != null &&
      !messageVisible &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.metaKey
    ) {
      const key = event.key.toLowerCase();
      let flag = true;
      if (key === "arrowup" || key === "w") {
        move(Direction.Up);
      } else if (key === "arrowright" || key === "d") {
        move(Direction.Right);
      } else if (key === "arrowdown" || key === "s") {
        move(Direction.Down);
      } else if (key === "arrowleft" || key === "a") {
        move(Direction.Left);
      } else {
        flag = false;
      }
      if (flag) {
        event.preventDefault();
      }
    } else if (messageVisible) {
      const key = event.key.toLowerCase();
      if (key === " " || key === "enter") {
        const gameMessage = document.querySelector("div.game-message");
        if (gameMessage != null) {
          gameMessage.click();
          event.preventDefault();
        }
      }
    }
  };

  const _moveG = (direction) => {
    if (gameRef.current != null && !messageVisible) {
      if (direction === Hammer.DIRECTION_UP) {
        gameRef.current.move(Direction.Up);
      } else if (direction === Hammer.DIRECTION_RIGHT) {
        gameRef.current.move(Direction.Right);
      } else if (direction === Hammer.DIRECTION_DOWN) {
        gameRef.current.move(Direction.Down);
      } else if (direction === Hammer.DIRECTION_LEFT) {
        gameRef.current.move(Direction.Left);
      }
    }
  };

  //控制键盘移动
  const move = (direction) => {
    let txb = new TransactionBlock();
    txb.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::${MOVE_FUNCTION_NAME}`,
      arguments: [
        txb.object(gameId),
        txb.object(weather_object_id),
        txb.pure(direction),
      ],
    });
    txb.setSender(currentAccount?.address);
    signAndExecuteTransactionBlock(
      {
        transactionBlock: txb,
      },
      {
        onSuccess: async (data_, variables, context) => {
          await refetch();
          gameRef.current._options.onUpdate(tilesData._tiles);
        },
        onError(error) {
          console.log({ error });
          console.log("失败。");
        },
      }
    );
  };

  const _tryResumeGame = () => {
    const { best, score, game } = stateManager.getState();
    // setBest(best);
    changeStateFun({ best, score });
    // setScore(score);
    if (game) {
      setMessageVisible(false);
    }
    if (game != null) {
      // @ts-ignore
      window.gtag("event", "resume_game", {
        score: props.score,
        best: props.best,
      });
      _createGame(game);
    }
  };

  const _newGame = (event) => {
    if (!isConnected) {
      toast("请连接钱包后，创建新游戏!");
      return;
    }
    if (event != null) {
      event.currentTarget.blur();
    }
    let txb = new TransactionBlock();
    txb.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::${SEND_FUNCTION_NAME}`,
      arguments: [txb.object(weather_object_id)],
      // typeArguments: [SUI_TYPE_ARG],
    });
    txb.setSender(currentAccount?.address);
    signAndExecuteTransactionBlock(
      {
        transactionBlock: txb,
        options: {
          showEffects: true,
          /** Whether to show transaction events. Default to be False */
          showEvents: true,
          /** Whether to show transaction input data. Default to be False */
          showInput: true,
          /** Whether to show object_changes. Default to be False */
          showObjectChanges: true,
          /** Whether to show bcs-encoded transaction input data */
          showRawInput: true,
        },
      },
      {
        async onSuccess(response) {
          const objectId = response.objectChanges[1].objectId;
          console.log({ objectId });
          setGameId(objectId);
          setTimeout(
            () => {
              if (soundManager != null) {
                soundManager.play(2);
                _createGame();
              }
            },
            messageVisible ? 250 : 50
          );
          changeStateFun({
            score: 0,
            messageVisible: false,
          });
          // @ts-ignore
          window.gtag("event", "new_game");
        },
        onError(error) {
          console.log({ error });
          console.log("失败。");
        },
      }
    );
  };

  const initGame = (firstUpdate, state) => {
    gameRef.current = new Game2048({
      onUpdate: (tiles) => {
        setTiles(tiles);
        if (!firstUpdate || state == null) {
          vibratorManager.vibrateShort(1);
        }
        firstUpdate = false;
      },
      onScoreAdd: (value) => {
        changeStateFun({
          best: Math.max(value, props.best),
          score: value,
          scoreAdded: 0,
        });

        setTimeout(() => {
          changeStateFun({
            scoreAdded: value,
          });
        }, 50);

        changeStateFun({
          scoreAdded: value,
        });
      },
      onMaxMerge: (value) => {
        if (soundManager != null) {
          soundManager.play(value);
          vibratorManager.vibrateShort(2);
        }
      },
      on2048: (gameOver) => {
        vibratorManager.vibrateLong();
        setMessage(gameOver ? "win-game-over" : "win");
        setMessageVisible(true);
        // @ts-ignore
        window.gtag("event", "win");
        if (gameOver) {
          // @ts-ignore
          window.gtag("event", "game_over", {
            score: props.score,
            best: props.best,
          });
        }
      },
      onGameOver: () => {
        vibratorManager.vibrateLong();
        setMessage("game-over");
        setMessageVisible(true);
        // @ts-ignore
        window.gtag("event", "game_over", {
          score: props.score,
          best: props.best,
        });
      },
      onStateChanged: (newState) => {
        stateManager.setState({
          best: props.best,
          score: newState != null ? props.score : 0,
          game: newState,
        });
      },
      state,
    });
    gameRef.current._options.onUpdate(tilesData._tiles);
  };

  const _createGame = (state = null) => {
    let firstUpdate = true;
    initGame(firstUpdate);
    changeStateFun({
      logoPulse: true,
    });
    // gameRef.current._options.onUpdate(tilesData);
  };

  return (
    <>
      <div>
        <ToastContainer />
      </div>
      <section className="actions">
        <div className="new-game-wrapper">
          <button className="new-game" onClick={_newGame}>
            新游戏
          </button>
        </div>
        <div className="hint">
          移动、合并相同方块。目标是: <strong>篮球</strong> !
        </div>
      </section>

      <section className={`game${messageVisible ? " has-message" : ""}`}>
        <div className="game-container" ref={containerRef}>
          {[0, 1, 2, 3].map((i) =>
            [0, 1, 2, 3].map((j) => (
              <span
                className={`game-cell pos-i-${i} pos-j-${j}`}
                key={`${i}-${j}`}
              />
            ))
          )}
          {tiles.map(({ i, j, value, key, overlaid }) => (
            <Tile i={i} j={j} value={value} key={key} overlaid={overlaid} />
          ))}
        </div>
        {message === "start" && (
          <div
            className="game-message"
            role="button"
            aria-label="隐藏消息"
            onClick={_newGame}
          >
            <div className="start" role="img" aria-label="耳机" />
            <h2>开始游戏!</h2>
            <p>
              点按以开始
              <br />
              <small>[请勿在公共场合外放]</small>
            </p>
          </div>
        )}
        {message === "win" && (
          <div
            className="game-message"
            role="button"
            aria-label="隐藏消息"
            onClick={() => setMessageVisible(false)}
          >
            <div className="win" role="img" aria-label="篮球" />
            <h2>恭喜你成功了!</h2>
            <p>点按以继续</p>
          </div>
        )}
        {message === "win-game-over" && (
          <div
            className="game-message"
            role="button"
            aria-label="隐藏消息"
            onClick={() => setMessageVisible(false)}
          >
            <div className="win" role="img" aria-label="篮球" />
            <h2>你成功了!</h2>
            <p>
              点按以隐藏提示
              <br />
              <small>[游戏结束]</small>
            </p>
          </div>
        )}
        {message === "game-over" && (
          <div
            className="game-message"
            role="button"
            aria-label="隐藏消息"
            onClick={() => setMessageVisible(false)}
          >
            <div className="game-over" role="img" aria-label="菜" />
            <h2>游戏结束!</h2>
            <p>点按以隐藏提示</p>
          </div>
        )}
      </section>
    </>
  );
}
