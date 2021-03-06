import React, { Component } from 'react';
import 'brace';
import 'brace/mode/jsx';
import 'brace/mode/javascript';
import 'brace/theme/textmate';
import 'brace/theme/monokai';

import { Spin } from 'antd';

import Grid from 'components/Grid';
import GridItem from 'components/Grid/GridItem';
import CodeWidget from 'components/Widgets/CodeWidget';
import ResultWidget from 'components/Widgets/ResultWidget';
import AnswerWidget from 'components/Widgets/AnswerWidget';
import CommentArea from '../Comment';

import debouncedRunCode from 'utils/runCode';
import { REACT as GRID_LABEL_REACT } from 'utils/gridLabel';

import styles from './ReactPage.module.scss';

class ReactPage extends Component {
  controlHeight = 70;

  async componentDidMount() {
    const { compiledCode, addTape } = this.props;
    debouncedRunCode({ code: compiledCode, onTapeUpdate: addTape });
  }

  shouldComponentUpdate(nextProps) {
    const { compiledCode: previousCompiledCode } = this.props;
    const { compiledCode } = nextProps;
    if (previousCompiledCode !== compiledCode) {
      debouncedRunCode({ code: compiledCode });
    }
    return true;
  }

  render() {
    const { handleCodeChange, test, code, isLoading, comments } = this.props;
    const layout = [
      {
        key: 'code',
        x: 0,
        y: 0,
        width: window.innerWidth / 2,
        height: window.innerHeight / 2,
        minWidth: 100,
        minHeight: 100,
        maxWidth: 700,
        maxHeight: 500,
      },
      {
        key: 'test',
        x: 0,
        y: 1,
        width: window.innerWidth / 2,
        height: window.innerHeight / 2,
        minWidth: 100,
        maxWidth: 700,
      },
      {
        key: 'result',
        x: 1,
        y: 0,
        width: window.innerWidth / 2,
        height: (window.innerHeight - this.controlHeight) / 2 - 100,
        minWidth: 100,
        minHeight: 100,
        maxWidth: 700,
        maxHeight: 500,
      },
      {
        key: 'answer',
        x: 1,
        y: 1,
        width: window.innerWidth / 2,
        height: (window.innerHeight - this.controlHeight) / 2 - 100,
        minWidth: 100,
        minHeight: 100,
        maxWidth: 700,
        maxHeight: 500,
      },
      {
        key: 'comment',
        x: 1,
        y: 3,
        width: window.innerWidth / 2,
        height: 200,
        minWidth: 100,
        minHeight: 100,
        maxWidth: 700,
        maxHeight: 500,
      },
    ];
    return (
      <div className={styles.app}>
        <Spin spinning={isLoading} size="large">
          <Grid layout={layout} totalWidth="100%" totalHeight="100%" autoResize>
            <GridItem key="code" label={GRID_LABEL_REACT.code}>
              <CodeWidget
                handleCodeChange={handleCodeChange}
                data={code}
                mode="jsx"
                theme="monokai"
                readOnly
              />
            </GridItem>
            <GridItem key="test" label={GRID_LABEL_REACT.test}>
              <CodeWidget data={test} mode="jsx" theme="textmate" readOnly />
            </GridItem>
            <GridItem key="answer" label={GRID_LABEL_REACT.answer}>
              <AnswerWidget />
            </GridItem>
            <GridItem key="result" label={GRID_LABEL_REACT.result}>
              <ResultWidget />
            </GridItem>
            <GridItem key="comment" label="comment">
              <CommentArea comments={comments} />
            </GridItem>
          </Grid>
        </Spin>
      </div>
    );
  }
}

export default ReactPage;
