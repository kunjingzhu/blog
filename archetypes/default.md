---
title: "{{ replace .File.ContentBaseName "-" " " | strings.TrimSuffix " " | title }}"
date: {{ .Date }}
draft: true
description: ""
categories: []
tags: []
ShowToc: true
---
