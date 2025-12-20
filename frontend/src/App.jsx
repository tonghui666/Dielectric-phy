import React, { useEffect, useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import axios from 'axios';
import { Layout, Typography, Spin, Drawer, Tag, Empty, Select, FloatButton, message, Switch, Modal, Button, Radio, Segmented, Tour, Input } from 'antd';
import { ExperimentOutlined, ThunderboltOutlined, ReadOutlined, HistoryOutlined, BulbOutlined, SearchOutlined, CameraOutlined, ReloadOutlined, CompressOutlined, MoonOutlined, SunOutlined, TrophyOutlined, AppstoreOutlined, DeploymentUnitOutlined, UserOutlined, InfoCircleOutlined, QuestionCircleOutlined, RobotOutlined, SendOutlined } from '@ant-design/icons';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import './App.css';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;
const { Option } = Select;

function App() {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [layoutType, setLayoutType] = useState('force');
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedSection, setSelectedSection] = useState('全部章节');
  
  const sections = React.useMemo(() => {
    if (!quizQuestions.length) return [];
    const s = new Set(quizQuestions.map(q => q.section || '默认章节'));
    return ['全部章节', ...Array.from(s)];
  }, [quizQuestions]);

  const [developerModalVisible, setDeveloperModalVisible] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [viewHistory, setViewHistory] = useState([]);
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'system', content: '你好！我是李玲霞的AI助教。有什么我可以帮你的吗？' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const refSearch = useRef(null);
  const refLayout = useRef(null);
  const refQuiz = useRef(null);
  const refProf = useRef(null);
  const refTheme = useRef(null);
  const refDev = useRef(null);
  
  const quizTimerRef = useRef(null);

  const tourSteps = [
    {
      title: '欢迎来到电介质物理知识图谱',
      description: '这是一个交互式的知识探索平台，帮助您直观地学习电介质物理的核心概念。',
      target: null,
    },
    {
      title: '切换布局',
      description: '点击这里可以在“力导向图”和“环形布局”之间切换，从不同视角观察知识结构。',
      target: () => refLayout.current,
    },
    {
      title: '李玲霞教授课题组',
      description: '快速定位到李玲霞教授及其课题组的相关研究成果。',
      target: () => refProf.current,
    },
    {
      title: '知识测验',
      description: '学习累了吗？来做个小测验，检验一下你的学习成果吧！',
      target: () => refQuiz.current,
    },
    {
      title: '开发者信息',
      description: '了解幕后开发者的故事。',
      target: () => refDev.current,
    },
    {
      title: '深色模式',
      description: '点击切换深色/浅色模式，保护视力。',
      target: () => refTheme.current,
    },
    {
      title: '知识搜索',
      description: '输入关键词，快速查找特定的知识点或概念。',
      target: () => refSearch.current,
    },
  ];
  
  const echartsRef = useRef(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    // Set initial theme
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/graph');
        if (response.data && response.data.error) {
            console.error('Backend Error:', response.data.error);
            message.error(`数据加载失败: ${response.data.error}`);
            setLoading(false);
            return;
        }
        setGraphData(response.data);
      } catch (error) {
        console.error('Error fetching graph data:', error);
        message.error('网络请求失败，请检查网络或服务器状态');
      } finally {
        setLoading(false);
      }
    };

    const fetchQuiz = async () => {
      try {
        const response = await axios.get('/api/quiz');
        if (Array.isArray(response.data)) {
            setQuizQuestions(response.data);
        }
      } catch (error) {
        console.error('Error fetching quiz data:', error);
      }
    };

    fetchData();
    fetchQuiz();
  }, []);

  const toggleTheme = (checked) => {
    setIsDarkMode(checked);
  };

  const startQuiz = () => {
    if (quizTimerRef.current) clearTimeout(quizTimerRef.current);

    if (!quizQuestions || quizQuestions.length === 0) {
      messageApi.warning('题库加载中或暂无题目');
      return;
    }
    
    // Filter questions based on selectedSection
    let availableQuestions = quizQuestions;
    if (selectedSection !== '全部章节') {
      availableQuestions = quizQuestions.filter(q => (q.section || '默认章节') === selectedSection);
    }
    
    if (availableQuestions.length === 0) {
       messageApi.warning('该章节暂无题目');
       return;
    }

    const randomQ = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    
    setCurrentQuestion(randomQ);
    setUserAnswer(null);
    setShowAnswer(false);
    setQuizModalVisible(true);
  };

  const handleChoiceSelect = (e) => {
    const answerLabel = e.target.value;
    setUserAnswer(answerLabel);
    
    if (answerLabel === currentQuestion.answer) {
      setQuizScore(s => s + 10);
      messageApi.success('回答正确！+10分');
      if (quizTimerRef.current) clearTimeout(quizTimerRef.current);
      quizTimerRef.current = setTimeout(startQuiz, 1500); // Next question automatically
    } else {
      messageApi.error('回答错误，请重试');
    }
  };

  const handleFillSubmit = () => {
    if (!userAnswer) {
      messageApi.warning('请输入答案');
      return;
    }
    
    // Simple normalization for comparison
    const normalize = (str) => str.replace(/[\s,，;；.。]/g, '').toLowerCase();
    
    if (normalize(userAnswer) === normalize(currentQuestion.answer)) {
      setQuizScore(s => s + 10);
      messageApi.success('回答正确！+10分');
      if (quizTimerRef.current) clearTimeout(quizTimerRef.current);
      quizTimerRef.current = setTimeout(startQuiz, 1500);
    } else {
      messageApi.error(`回答错误，正确答案是：${currentQuestion.answer}`);
    }
  };

  const getStats = () => {
    if (!graphData) return { nodes: 0, relations: 0, categories: 0 };
    return {
      nodes: graphData.nodes.length,
      relations: graphData.links.length,
      categories: graphData.categories.length
    };
  };

  const addToHistory = (node) => {
    setViewHistory(prev => {
      const newHistory = [node, ...prev.filter(n => n.id !== node.id)].slice(0, 5);
      return newHistory;
    });
  };

  const onChartClick = (params) => {
    if (params.dataType === 'node') {
      const nodeData = graphData.nodes.find(n => n.id === params.data.id);
      setSelectedNode(nodeData);
      setDrawerOpen(true);
      addToHistory(nodeData);
    }
  };

  const onEvents = {
    'click': onChartClick
  };

  const handleSearch = (value) => {
    const node = graphData.nodes.find(n => n.id === value);
    if (node) {
      setSelectedNode(node);
      setDrawerOpen(true);
      addToHistory(node);
      if (echartsRef.current) {
        const instance = echartsRef.current.getEchartsInstance();
        instance.dispatchAction({
          type: 'focusNodeAdjacency',
          seriesIndex: 0,
          dataIndex: graphData.nodes.findIndex(n => n.id === value)
        });
      }
    }
  };
  
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setChatLoading(true);
    
    try {
      const response = await axios.post('/api/chat', { message: userMsg });
      if (response.data && response.data.answer) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.answer }]);
      } else {
         setChatMessages(prev => [...prev, { role: 'assistant', content: '抱歉，服务器暂时没有响应。' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: '网络请求出错，请稍后再试。' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleResetView = () => {
    if (echartsRef.current) {
      echartsRef.current.getEchartsInstance().dispatchAction({
        type: 'restore'
      });
      messageApi.success('视图已重置');
    }
  };

  const handleExportImage = () => {
    if (echartsRef.current) {
      const url = echartsRef.current.getEchartsInstance().getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#f4f6f9'
      });
      const link = document.createElement('a');
      link.download = '电介质物理知识图谱.png';
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      messageApi.success('图谱导出成功');
    }
  };

  const getOption = () => {
    if (!graphData) return {};

    // Scientific Color Palette (Adaptive)
    const colors = [
      '#1890ff', // root
      '#13c2c2', // overview
      '#722ed1', // history
      '#fa8c16', // phenomenon
      '#52c41a', // mechanism
      '#eb2f96', // conduction_type
      '#faad14', // loss_type
      '#f5222d', // breakdown_type
      '#2f54eb', // theory
      '#722ed1', // theory_detail
      '#d48806', // expert
      '#08979c'  // research_focus
    ];
    
    const textColor = isDarkMode ? '#e6f7ff' : '#1f1f1f';
    const subTextColor = isDarkMode ? '#a6a6a6' : '#595959';
    const legendBg = isDarkMode ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)';

    return {
      backgroundColor: 'transparent',
      color: colors,
      darkMode: isDarkMode,
      title: {
        text: '电介质物理知识图谱',
        subtext: 'Dielectric Physics Knowledge Graph',
        top: '20',
        left: '20',
        textStyle: {
          color: textColor,
          fontSize: 24,
          fontWeight: 'bold'
        },
        subtextStyle: {
          color: subTextColor
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDarkMode ? '#333' : '#e6f7ff',
        textStyle: {
          color: textColor
        },
        formatter: (params) => {
          if (params.dataType === 'node') {
            const node = graphData.nodes.find(n => n.id === params.data.id);
            return `<div style="padding: 4px;">
              <div style="font-weight: bold; color: ${params.color}; font-size: 16px; margin-bottom: 4px;">${node.name}</div>
              <div style="color: ${subTextColor}; font-size: 12px;">${node.category}</div>
            </div>`;
          }
          return params.name;
        }
      },
      legend: {
        data: graphData.categories.map(c => c.name),
        bottom: '30',
        right: '30',
        orient: 'vertical',
        backgroundColor: legendBg,
        borderRadius: 8,
        padding: 16,
        itemGap: 12,
        textStyle: {
          color: subTextColor
        }
      },
      series: [
        {
          name: '电介质物理',
          type: 'graph',
          layout: layoutType,
          data: graphData.nodes.map(node => {
            const isProf = node.id === 'prof_li';
            return {
              ...node,
              symbolSize: isProf ? 80 : node.symbolSize,
              label: {
                show: node.symbolSize > 25 || isProf,
                fontSize: isProf ? 18 : 12,
                fontWeight: isProf ? 'bold' : 'normal',
                color: isProf ? '#faad14' : textColor,
                textBorderColor: isDarkMode ? '#000' : '#fff',
                textBorderWidth: 2
              },
              itemStyle: {
                color: isProf ? '#faad14' : undefined,
                shadowBlur: isProf ? 30 : 10,
                shadowColor: isProf ? 'rgba(250, 173, 20, 0.6)' : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                borderColor: isProf ? '#fff' : undefined,
                borderWidth: isProf ? 2 : 0
              }
            };
          }),
          links: graphData.links,
          categories: graphData.categories,
          roam: true,
          label: {
            position: 'right',
            formatter: '{b}'
          },
          lineStyle: {
            color: 'source',
            curveness: 0.2,
            width: 1.5,
            opacity: 0.6
          },
          emphasis: {
            focus: 'adjacency',
            scale: true,
            lineStyle: {
              width: 4,
              opacity: 1
            },
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(0,0,0,0.3)'
            }
          },
          force: {
            repulsion: 500,
            edgeLength: [80, 250],
            gravity: 0.08,
            friction: 0.6
          }
        }
      ]
    };
  };

  const renderNodeDetails = () => {
    if (!selectedNode) return <Empty description="请选择一个节点查看详情" />;

    return (
      <div style={{ paddingBottom: 20 }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <Tag className="node-category-tag" color="blue">{selectedNode.category}</Tag>
          {selectedNode.id === 'prof_li' && (
            <Tag color="#faad14" style={{ borderRadius: '12px', fontWeight: 'bold', border: 'none', padding: '4px 12px', marginBottom: 16 }}>
              ⭐ 课题组负责人
            </Tag>
          )}
          <Title level={2} style={{ margin: '8px 0', color: selectedNode.id === 'prof_li' ? '#faad14' : '#1890ff' }}>
            {selectedNode.name}
          </Title>
          
          {selectedNode.image && (
            <div className="node-image-container">
              <img 
                src={selectedNode.image} 
                alt={selectedNode.name} 
                className="node-image"
              />
            </div>
          )}
        </div>

        {selectedNode.description && (
          <div className="detail-section">
            <div className="section-title">
              <ReadOutlined className="section-icon" />
              <span>{selectedNode.category === 'expert' ? '个人简介' : '定义与概念'}</span>
            </div>
            <div className="markdown-content">
              <ReactMarkdown 
                children={selectedNode.description} 
                remarkPlugins={[remarkMath]} 
                rehypePlugins={[rehypeKatex]}
              />
            </div>
          </div>
        )}

        {selectedNode.formula && (
          <div className="detail-section">
            <div className="section-title">
              <ExperimentOutlined className="section-icon" />
              <span>核心公式</span>
            </div>
            <div className="formula-container">
              <BlockMath math={selectedNode.formula} />
            </div>
          </div>
        )}

        {selectedNode.details && (
          <div className="detail-section">
            <div className="section-title">
              <ThunderboltOutlined className="section-icon" />
              <span>{selectedNode.category === 'expert' ? '详细介绍' : '详细机制与说明'}</span>
            </div>
             <div className="markdown-content">
              <ReactMarkdown 
                children={selectedNode.details} 
                remarkPlugins={[remarkMath]} 
                rehypePlugins={[rehypeKatex]}
              />
            </div>
          </div>
        )}

        {viewHistory.length > 0 && (
          <div className="detail-section" style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginTop: 24 }}>
            <div className="section-title">
              <HistoryOutlined className="section-icon" />
              <span>最近浏览</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {viewHistory.map(node => (
                <Tag 
                  key={node.id} 
                  color="blue" 
                  style={{ cursor: 'pointer', padding: '4px 10px' }}
                  onClick={() => handleSearch(node.id)}
                >
                  {node.name}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout className="app-layout">
      {contextHolder}
      <Header className="app-header">
        <div className="header-title">
          <img src="/631.jpg" alt="Tianjin University Logo" className="header-logo" />
          <div>
            <Title level={4} style={{ margin: 0, color: 'var(--text-primary)', lineHeight: '1.2' }}>
              电介质物理知识图谱
            </Title>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
              天津大学 · <span style={{ fontWeight: 'bold', color: '#1890ff' }}>李玲霞</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div ref={refLayout}>
            <Segmented
              options={[
                { label: '力导向', value: 'force', icon: <DeploymentUnitOutlined /> },
                { label: '环形', value: 'circular', icon: <ReloadOutlined /> },
              ]}
              value={layoutType}
              onChange={setLayoutType}
            />
          </div>
          <Button 
            ref={refProf}
            type="primary" 
            icon={<UserOutlined />} 
            onClick={() => handleSearch('prof_li')}
            style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#fff' }}
          >
            李玲霞教授
          </Button>
          <Button 
            ref={refQuiz}
            type="primary" 
            icon={<TrophyOutlined />} 
            onClick={startQuiz}
            ghost
          >
            知识测验
          </Button>
          <Button 
            ref={refDev}
            icon={<InfoCircleOutlined />} 
            onClick={() => setDeveloperModalVisible(true)}
          >
            开发者
          </Button>
          <Button
            icon={<QuestionCircleOutlined />}
            onClick={() => setTourOpen(true)}
          >
            帮助
          </Button>
          <div ref={refTheme}>
            <Switch
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
              onChange={toggleTheme}
              className="theme-switch"
            />
          </div>
          <div ref={refSearch} style={{ minWidth: 200 }}>
            <Select
              className="header-search"
              showSearch
              placeholder="🔍 搜索知识点..."
              optionFilterProp="children"
              onChange={handleSearch}
              style={{ width: '100%' }}
              suffixIcon={<SearchOutlined style={{ color: '#1890ff' }} />}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {graphData && graphData.nodes.map(node => (
                <Option key={node.id} value={node.id}>{node.name}</Option>
              ))}
            </Select>
          </div>
        </div>
      </Header>

      <Tour open={tourOpen} onClose={() => setTourOpen(false)} steps={tourSteps} />

      <Content className="app-content">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#1890ff', fontWeight: 500 }}>正在构建知识图谱...</div>
          </div>
        ) : (
          <div className="chart-container">
            <ReactECharts 
              ref={echartsRef}
              option={getOption()} 
              style={{ height: '100%', width: '100%' }} 
              onEvents={onEvents}
              opts={{ renderer: 'canvas' }}
              theme={isDarkMode ? 'dark' : undefined}
            />
          </div>
        )}
        
        <Drawer
          title={null}
          placement="right"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          width={480}
          mask={false}
          className="custom-drawer"
          style={{ boxShadow: '-4px 0 16px rgba(0,0,0,0.08)' }}
        >
          {renderNodeDetails()}
        </Drawer>

        <FloatButton.Group shape="circle" style={{ right: 24, bottom: 24 }}>
          <FloatButton icon={<ReloadOutlined />} tooltip="重置视图" onClick={handleResetView} />
          <FloatButton icon={<CameraOutlined />} tooltip="导出图片" onClick={handleExportImage} />
        </FloatButton.Group>

        <FloatButton 
          icon={<RobotOutlined />} 
          tooltip="李玲霞的AI助教" 
          onClick={() => setChatOpen(true)} 
          type="primary" 
          style={{ left: 24, bottom: 24, width: 56, height: 56 }} 
          className="ai-chat-button"
        />
        
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RobotOutlined style={{ color: '#1890ff', fontSize: '24px' }} />
              <span>李玲霞的AI助教</span>
            </div>
          }
          placement="right"
          onClose={() => setChatOpen(false)}
          open={chatOpen}
          width={400}
          mask={false}
          style={{ boxShadow: '-4px 0 16px rgba(0,0,0,0.1)' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
              {chatMessages.map((msg, index) => (
                <div key={index} style={{ 
                  marginBottom: 16, 
                  textAlign: msg.role === 'user' ? 'right' : 'left' 
                }}>
                  <div style={{ 
                    display: 'inline-block',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: msg.role === 'user' ? '#1890ff' : (isDarkMode ? '#333' : '#f0f2f5'),
                    color: msg.role === 'user' ? '#fff' : (isDarkMode ? '#fff' : '#000'),
                    maxWidth: '85%',
                    textAlign: 'left',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown 
                        children={msg.content} 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                      />
                    ) : msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ textAlign: 'left' }}>
                  <Spin size="small" /> 思考中...
                </div>
              )}
            </div>
            
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, display: 'flex', gap: 8 }}>
              <Input 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onPressEnter={handleChatSubmit}
                placeholder="问问AI关于电介质的问题..."
                disabled={chatLoading}
              />
              <Button type="primary" icon={<SendOutlined />} onClick={handleChatSubmit} loading={chatLoading} />
            </div>
          </div>
        </Drawer>

        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrophyOutlined style={{ color: '#faad14', fontSize: '24px' }} />
              <span>知识挑战 (当前得分: {quizScore})</span>
            </div>
          }
          open={quizModalVisible}
          onCancel={() => {
            if (quizTimerRef.current) clearTimeout(quizTimerRef.current);
            setQuizModalVisible(false);
          }}
          footer={null}
          centered
          width={600}
        >
          {currentQuestion && (
            <div className="quiz-container" key={currentQuestion.id}>
              <div style={{ marginBottom: 16 }}>
                <Select 
                  value={selectedSection} 
                  onChange={(val) => {
                    if (quizTimerRef.current) clearTimeout(quizTimerRef.current);
                    setSelectedSection(val);
                    const newSection = val;
                    let available = quizQuestions;
                    if (newSection !== '全部章节') {
                      available = quizQuestions.filter(q => (q.section || '默认章节') === newSection);
                    }
                    if (available.length > 0) {
                      const randomQ = available[Math.floor(Math.random() * available.length)];
                      setCurrentQuestion(randomQ);
                      setUserAnswer(null);
                      setShowAnswer(false);
                    } else {
                        messageApi.warning('该章节暂无题目');
                    }
                  }}
                  style={{ width: '100%' }}
                >
                  {sections.map(s => (
                    <Option key={s} value={s}>{s}</Option>
                  ))}
                </Select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <Tag color="blue">题目 {currentQuestion.id}</Tag>
                <Tag color={currentQuestion.type === 'fill' ? 'orange' : 'cyan'}>
                  {currentQuestion.type === 'fill' ? '填空题' : '选择题'}
                </Tag>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{currentQuestion.question}</span>
              </div>
              
              {currentQuestion.type === 'fill' ? (
                <div>
                  <Input.TextArea 
                    value={userAnswer || ''} 
                    onChange={(e) => setUserAnswer(e.target.value)} 
                    placeholder="请输入答案，多个答案请用分号或空格隔开"
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    style={{ marginBottom: 16, fontSize: '16px' }}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        handleFillSubmit();
                      }
                    }}
                  />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Button type="primary" onClick={handleFillSubmit} flex={1} size="large" style={{ flex: 1 }}>
                      提交答案
                    </Button>
                    <Button onClick={() => setShowAnswer(true)} size="large">
                      查看答案
                    </Button>
                    <Button onClick={startQuiz} size="large">
                      跳过
                    </Button>
                  </div>
                  
                  {showAnswer && (
                    <div style={{ 
                      marginTop: 16, 
                      padding: '12px', 
                      background: '#fffbe6', 
                      border: '1px solid #ffe58f',
                      borderRadius: '8px',
                      color: '#d48806'
                    }}>
                      <strong>正确答案：</strong> {currentQuestion.answer}
                    </div>
                  )}
                </div>
              ) : (
                <Radio.Group onChange={handleChoiceSelect} value={userAnswer} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {currentQuestion.options.map(option => (
                      <Radio.Button 
                        key={option.label} 
                        value={option.label}
                        style={{ 
                          height: 'auto', 
                          padding: '12px 16px', 
                          borderRadius: '8px',
                          textAlign: 'left',
                          borderColor: userAnswer === option.label 
                            ? (userAnswer === currentQuestion.answer ? '#52c41a' : '#ff4d4f') 
                            : undefined,
                          background: userAnswer === option.label 
                            ? (userAnswer === currentQuestion.answer ? '#f6ffed' : '#fff1f0') 
                            : undefined
                        }}
                        disabled={userAnswer === currentQuestion.answer}
                      >
                        <div style={{ fontWeight: 'bold' }}>{option.label}. {option.content}</div>
                      </Radio.Button>
                    ))}
                  </div>
                </Radio.Group>
              )}
              
              {currentQuestion.type !== 'fill' && userAnswer && (
                <div style={{ marginTop: 24, textAlign: 'right' }}>
                  {userAnswer === currentQuestion.answer ? (
                    <Button type="primary" onClick={startQuiz}>下一题</Button>
                  ) : (
                    <Button onClick={() => setQuizModalVisible(false)}>结束挑战</Button>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>

        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '24px' }} />
              <span>关于开发者</span>
            </div>
          }
          open={developerModalVisible}
          onCancel={() => setDeveloperModalVisible(false)}
          footer={null}
          centered
          width={400}
        >
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
              <img 
                src="/tonghui.jpg" 
                alt="童辉" 
                style={{ 
                  width: 120, 
                  height: 120, 
                  borderRadius: '50%', 
                  border: '4px solid #fff',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)' 
                }} 
              />
              <Tag color="#108ee9" style={{ position: 'absolute', bottom: 0, right: 0, borderRadius: '12px' }}>
                2023级本科生
              </Tag>
            </div>
            
            <Title level={3} style={{ marginBottom: 4 }}>童辉</Title>
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              天津大学微电子学院<br/>
              电子科学与技术、计算机科学与技术双学位
            </Paragraph>
            
            <div style={{ 
              textAlign: 'left', 
              background: 'var(--bg-color)', 
              padding: '16px', 
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              fontSize: '14px',
              lineHeight: '1.6',
              color: 'var(--text-secondary)'
            }}>
              <p style={{ margin: 0 }}>
                他是李玲霞老师的忠实粉丝，十分热爱电介质物理。在兴趣的驱使下，利用课余时间独立开发了这个知识图谱网站，旨在帮助同学们更直观地理解复杂的物理概念。
              </p>
            </div>
          </div>
        </Modal>
      </Content>
    </Layout>
  );
}

export default App;
