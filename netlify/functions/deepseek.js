// netlify/functions/deepseek.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // 设置 CORS 头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // 处理 OPTIONS 预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { messages, max_tokens = 600, temperature = 0.7 } = JSON.parse(event.body);

    // 从环境变量获取 API 密钥
    const API_KEY = process.env.DEEPSEEK_API_KEY;
    
    if (!API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: '服务器配置错误：未设置 API 密钥' })
      };
    }

    // 调用 DeepSeek API - 非流式版本（更稳定）
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        max_tokens: max_tokens,
        temperature: temperature,
        stream: false  // 使用非流式响应
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API 错误:', errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'DeepSeek API 调用失败', details: errorText })
      };
    }

    const data = await response.json();

    // 返回完整响应
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Function 错误:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '服务器内部错误', message: error.message })
    };
  }
};
