import React, { Component } from 'react';
import 'brace';
import 'brace/mode/javascript';
import 'brace/theme/textmate';
import 'brace/theme/monokai';

import { Spin } from 'antd';

import { transform } from '@babel/standalone';
import Grid from 'app/components/Grid';
import GridItem from 'app/components/Grid/GridItem';
import CodeWidget from 'app/components/Widgets/CodeWidget';
import TestWidget from 'app/components/Widgets/TestWidget';
import TapeWidget from 'app/components/Widgets/TapeWidget';

import { changeCategory } from 'app/actions/category';

import { getCategories } from 'app/questions/index';
import debouncedRunCode from 'app/utils/runCode';

import ControlWidget from '../ControlWidget';
import TagWidget from '../../TagWidget';
import styles from './JavaScriptPage.module.scss';


class JavaScriptPage extends Component {
  constructor(props) {
    super(props);
    this.controlHeight = 70;
    this.state = {
      code: '',
      compiledCode: '',
      test: '',
      tape: [],
      name: '',
      tags: [],
      isLoading: false
    };
  }

  componentDidMount() {
    const { compiledCode } = this.state;
    const { actions } = this.props;
    debouncedRunCode({ code: compiledCode, onTapeUpdate: this.addTape });
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { compiledCode: previousCompiledCode } = this.state;
    const { compiledCode } = nextState;
    if (previousCompiledCode !== compiledCode) {
      this.setState({ tape: [] }, () => {
        debouncedRunCode({ code: compiledCode, onTapeUpdate: this.addTape });
      });
    }
    return true;
  }

  addTape = (data) => {
    const { tape } = this.state;
    this.setState({
      tape: [...tape, data]
    });
  }

  onTagUpdate = (tags) => {
    this.setState({ tags });
  }

  onCodeChange = () => {
    const { code, test } = this.state;
    const fullCode = `${code} ${test}`;
    try {
      const { code: compiledCode } = transform(fullCode, {
        presets: ['es2015', ['stage-2', { decoratorsBeforeExport: true }], 'react'],
        plugins: ['proposal-object-rest-spread']
      });
      this.setState({ compiledCode });
    } catch (e) {
      console.log(e);
    }
  }

  onSubmit = async () => {
    const {
      tags,
      name,
      code,
      test
    } = this.state;
    const { onSubmit } = this.props;
    this.setState({ isLoading: true });
    await onSubmit({
      tags,
      name,
      code,
      test,
      type: 'javascript'
    });
    this.setState({ isLoading: false });
  }

  render() {
    const {
      test,
      code,
      tape,
      tags,
      isLoading
    } = this.state;
    const { onChangeCategory, index } = this.props;
    const layout = [
      {
        key: 'code', x: 0, y: 0, width: window.innerWidth / 2, height: window.innerHeight / 2, minWidth: 100, minHeight: 100, maxWidth: 700, maxHeight: 500
      },
      {
        key: 'test', x: 0, y: 1, width: window.innerWidth / 2, height: window.innerHeight / 2, minWidth: 100, maxWidth: 700
      },
      {
        key: 'control', x: 1, y: 0, width: window.innerWidth / 2, height: this.controlHeight, static: true
      },
      {
        key: 'tape', x: 1, y: 1, width: window.innerWidth / 2, height: (window.innerHeight - this.controlHeight) / 2, minWidth: 100, minHeight: 100, maxWidth: 700, maxHeight: 500
      },
      {
        key: 'tag', x: 1, y: 2, width: window.innerWidth / 2, height: (window.innerHeight - this.controlHeight) / 2, minWidth: 100, minHeight: 100, maxWidth: 700, maxHeight: 500
      },
    ];
    return (
      <div className={styles.app}>
        <Spin spinning={isLoading} size="large">
          <Grid layout={layout} totalWidth="100%" totalHeight="100%" autoResize>
            <GridItem key="code">
              <CodeWidget
                handleCodeChange={(newCode) => {
                  this.setState({ code: newCode }, this.onCodeChange);
                }}
                data={code}
                mode="javascript"
                theme="monokai"
              />
            </GridItem>
            <GridItem key="test">
              <TestWidget
                handleCodeChange={(newTest) => {
                  this.setState({ test: newTest }, this.onCodeChange);
                }}
                data={test}
                readOnly={false}
              />
            </GridItem>
            <GridItem key="control">
              <ControlWidget
                type="javascript"
                onChangeName={(name) => { this.setState({ name })}}
                onSubmit={this.onSubmit}
                onChangeCategory={onChangeCategory}
                index={index}
              />
            </GridItem>
            <GridItem key="tape">
              <TapeWidget data={tape} />
            </GridItem>
            <GridItem key="tag">
              <TagWidget data={tags} onTagUpdate={this.onTagUpdate} />
            </GridItem>
          </Grid>
        </Spin>
      </div>
    );
  }
}

export default JavaScriptPage;
